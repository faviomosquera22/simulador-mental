"""Build an educational NIfTI from NLM Visible Human Male frozen CT.
Requires numpy and Pillow. Source GE files are cached outside the repository.
Uses the documented GE Genesis RAS corner coordinates, physical spacing and
pixel offset. No patient headers are copied. Not a diagnostic reconstruction.
"""
import concurrent.futures, gzip, hashlib, json, re, struct, subprocess
from pathlib import Path
import numpy as np
from PIL import Image
BASE='https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/radiological/frozenCT/'
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path('/tmp/psyke-visible-human-frozen'); CACHE.mkdir(exist_ok=True)
OUT=ROOT/'public/tomography'; OUT.mkdir(exist_ok=True)
def fetch(name):
    p=CACHE/name
    if not p.exists():
        subprocess.run(['curl','-L','--fail','--retry','3','-s',BASE+name,'-o',str(p)+'.part'],check=True)
        Path(str(p)+'.part').rename(p)
    return p

def read_slice(name):
    p=fetch(name); raw=CACHE/name.removesuffix('.Z')
    if not raw.exists():
        # macOS uncompress cannot write to a pipe under some sandbox profiles.
        temp=CACHE/(name+'.decode.Z'); temp.write_bytes(p.read_bytes())
        subprocess.run(['uncompress','-f',str(temp)],check=True,stdout=subprocess.DEVNULL)
        Path(str(temp).removesuffix('.Z')).rename(raw)
    b=raw.read_bytes()
    assert b[:4]==b'IMGF'
    offset,w,h,depth,compression=struct.unpack_from('>5i',b,4)
    assert depth==16 and compression in (0,1)
    ih=struct.unpack_from('>i',b,148)[0]
    f=lambda o:struct.unpack_from('>f',b,ih+o)[0]
    tl=np.array([f(154),f(158),f(162)]);tr=np.array([f(166),f(170),f(174)]);br=np.array([f(178),f(182),f(186)])
    assert abs(tr[2]-tl[2])<.01 and abs(br[2]-tl[2])<.01, 'Oblique slice not supported'
    intercept=struct.unpack_from('>i',b,112)[0]
    data=np.frombuffer(b,dtype='>u2',offset=offset,count=w*h).reshape(h,w).astype(np.float32)+intercept
    # GE pixel-size fields agree with corner FOV / matrix size (not size-1).
    sx,sy=f(50),f(54)
    assert abs(abs(tr[0]-tl[0])/w-sx)<.02 and abs(abs(br[1]-tr[1])/h-sy)<.02
    return {'name':name,'z':float(2882-int(name[4:8])),'scannerZ':float(tl[2]),'tl':tl.tolist(),'spacing':[sx,sy],'data':data,'intercept':intercept}

def nifti(path, volume, origin, spacing):
    # volume is Z,Y,X; contiguous bytes have X as fastest-changing dimension.
    z,y,x=volume.shape; h=bytearray(352)
    struct.pack_into('<i',h,0,348);struct.pack_into('<8h',h,40,3,x,y,z,1,1,1,1)
    struct.pack_into('<hh',h,70,4,16);struct.pack_into('<8f',h,76,1,*spacing,1,1,1,1)
    struct.pack_into('<fff',h,108,352,1,0);h[123]=2
    struct.pack_into('<h',h,254,1)
    struct.pack_into('<12f',h,280,spacing[0],0,0,origin[0],0,spacing[1],0,origin[1],0,0,spacing[2],origin[2])
    h[148:148+len(b'NLM Visible Human; educational resampling')]=b'NLM Visible Human; educational resampling'
    h[344:348]=b'n+1\0'
    with gzip.open(path,'wb',compresslevel=6) as f:f.write(h);f.write(volume.astype('<i2').tobytes())

def main():
    index=fetch('index.html').read_text(); names=sorted(set(re.findall(r'c_vm\d+\.fro\.Z',index)))[::3]
    records=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures=[pool.submit(read_slice,n) for n in names]
        for i,f in enumerate(concurrent.futures.as_completed(futures)):
            try: records.append(f.result())
            except subprocess.CalledProcessError as e: print('Unavailable source slice:',e.cmd[-3],flush=True)
            if (i+1)%50==0:print('Downloaded and decoded',i+1,'/',len(names),flush=True)
    # NLM filename numbers map to cryosection positions in millimeters. Scanner
    # table coordinates reset across series, so they cannot be used as global Z.
    # See ImagingDataCommons/NLM-Visible-Human-Project-DICOM-Conversion README.
    records.sort(key=lambda r:r['z'])
    # Physical RAS grid: x from patient's left toward right, y posterior to anterior.
    # 2.5 mm in-plane and 3 mm superior-inferior keeps the asset mobile-friendly.
    step=2.5; xs=np.arange(-280,280+step/2,step);ys=np.arange(-220,340+step/2,step)
    planes=[]
    for r in records:
        sx,sy=r['spacing'];tl=r['tl'];a=r['data']
        ix=(tl[0]-xs)/sx;iy=(tl[1]-ys)/sy
        x0=np.floor(ix).astype(int);y0=np.floor(iy).astype(int);wx=ix-x0;wy=iy-y0
        valid=(iy[:,None]>=0)&(iy[:,None]<a.shape[0]-1)&(ix[None,:]>=0)&(ix[None,:]<a.shape[1]-1)
        x0=np.clip(x0,0,a.shape[1]-2);y0=np.clip(y0,0,a.shape[0]-2)
        q=(1-wy[:,None])*((1-wx)*a[y0[:,None],x0]+wx*a[y0[:,None],x0+1])+wy[:,None]*((1-wx)*a[y0[:,None]+1,x0]+wx*a[y0[:,None]+1,x0+1])
        planes.append(np.where(valid,q,-1024))
    positions=np.array([r['z'] for r in records]);zs=np.arange(positions[0],positions[-1]+.1,3.)
    volume=np.empty((len(zs),len(ys),len(xs)),dtype=np.int16)
    missing=[]
    for i,z in enumerate(zs):
        hi=int(np.searchsorted(positions,z));hi=min(max(hi,1),len(records)-1);lo=hi-1
        gap=positions[hi]-positions[lo]
        if gap>15:
            volume[i]=-1024;missing.append(float(z));continue
        t=(z-positions[lo])/max(gap,.001)
        volume[i]=np.round(planes[lo]*(1-t)+planes[hi]*t)
    nifti(OUT/'whole-body.nii.gz',volume,[float(xs[0]),float(ys[0]),float(zs[0])],[step,step,3.])
    # Region crops use the same physical RAS grid; overlap intentionally includes boundaries.
    regions = {
        'head': (-145,145,-130,175,1690,1876),
        'neck': (-240,240,-180,240,1560,1710),
        'thorax': (-250,250,-200,240,1370,1595),
        'abdomen': (-250,250,-200,240,1110,1400),
        'pelvis': (-250,250,-200,240,920,1130),
        'upper-limbs': (-280,280,-200,240,950,1600),
        'lower-limbs': (-250,250,-200,240,1,1030),
    }
    region_info = {}
    for key,(xmin,xmax,ymin,ymax,zmin,zmax) in regions.items():
        xi=np.flatnonzero((xs>=xmin)&(xs<=xmax));yi=np.flatnonzero((ys>=ymin)&(ys<=ymax));zi=np.flatnonzero((zs>=zmin)&(zs<=zmax))
        crop=volume[np.ix_(zi,yi,xi)]
        origin=[float(xs[xi[0]]),float(ys[yi[0]]),float(zs[zi[0]])]
        nifti(OUT/f'region-{key}.nii.gz',crop,origin,[step,step,3.])
        region_info[key]={'originRAS':origin,'dimensionsXYZ':list(reversed(crop.shape)),'zRange':[float(zs[zi[0]]),float(zs[zi[-1]])],'sha256':hashlib.sha256((OUT/f'region-{key}.nii.gz').read_bytes()).hexdigest()}
    manifest={'source':BASE,'attribution':'National Library of Medicine, Visible Human Project, male frozen CT','terms':'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html','dimensionsXYZ':[len(xs),len(ys),len(zs)],'spacingMm':[step,step,3.],'originRAS':[float(xs[0]),float(ys[0]),float(zs[0])],'zRange':[float(zs[0]),float(zs[-1])],'regions':region_info,'sourceSliceCount':len(records),'missingZ':missing,'sourceZRange':[float(positions[0]),float(positions[-1])],'sourceSpacingInPlane':sorted(set(tuple(r['spacing']) for r in records)),'sha256':hashlib.sha256((OUT/'whole-body.nii.gz').read_bytes()).hexdigest(),'slices':[{'name':r['name'],'z':r['z'],'scannerZ':r['scannerZ'],'tl':r['tl'],'spacing':r['spacing'],'intercept':r['intercept']} for r in records]}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
    # QA montage: coronal, sagittal, and evenly spaced axial images.
    preview=Image.fromarray(np.uint8(np.clip((volume[:,len(ys)//2,:]+160)/600*255,0,255))).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    preview.resize((len(xs)*2,len(zs)*2)).save('/tmp/ct-coronal.png')
    print(json.dumps({k:v for k,v in manifest.items() if k!='slices'},indent=2),flush=True)
if __name__=='__main__':main()
