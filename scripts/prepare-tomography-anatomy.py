"""Register CC-BY-4.0 VOXEL-MAN SIO anatomy to the existing NLM CT atlas.
Requires numpy, Pillow, openpyxl, scipy and opencv-python-headless.
Inputs (download separately): /tmp/ct-sio.zip and /tmp/ct-sio-labels.xlsx.
No CT intensities are modified. Segmentation is an educational registration,
not clinical ground truth for the resampled atlas. Extras are explicitly marked
as morphology-derived references, not VOXEL-MAN segmentations.
"""
import concurrent.futures, gzip, hashlib, io, json, re, struct, sys, zipfile
from pathlib import Path
sys.path.insert(0,'/tmp/ct-registration')
import cv2
import numpy as np
import openpyxl
from PIL import Image
from scipy import ndimage
cv2.setNumThreads(1)
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/tomography'; META=OUT/'anatomy.json'
DIRECT={
 'abdominal aorta':'Aorta abdominal','ampulla':'Ampolla','arch of aorta':'Arco aórtico','ascending aorta':'Aorta ascendente','azygos vein':'Vena ácigos','brachiocephalic vein':'Vena braquiocefálica','bronchi':'Bronquios','caecum':'Ciego','cardia':'Cardias','coccyx':'Cóccix','corpus cavernosum penis':'Cuerpo cavernoso del pene','corpus spongiosum penis':'Cuerpo esponjoso del pene','cystic duct':'Conducto cístico','descending aorta':'Aorta descendente','diaphragm':'Diafragma','duodenum (retroperitoneal part)':'Duodeno retroperitoneal','gallbladder':'Vesícula biliar','greater curvature':'Curvatura mayor del estómago','grey matter':'Sustancia gris (médula espinal)','hepatic veins':'Venas hepáticas','inferior mesenteric vein':'Vena mesentérica inferior','inferior vena cava':'Vena cava inferior','ischiocavernosus':'Músculo isquiocavernoso','larynx':'Laringe','lesser curvature':'Curvatura menor del estómago','liver':'Hígado','myocardium':'Miocardio','pancreas':'Páncreas','pelvic diaphragm':'Diafragma pélvico','penis':'Pene','pericardium':'Pericardio','portal vein':'Vena porta','prostate':'Próstata','pulmonary arteries':'Arterias pulmonares','pulmonary trunk':'Tronco pulmonar','pulmonary veins':'Venas pulmonares','rectum':'Recto','rectus sheath':'Vaina de los rectos abdominales','sacrum':'Sacro','scrotum':'Escroto','seminal gland':'Vesícula seminal','sigmoid colon':'Colon sigmoide','small intestine':'Intestino delgado','spleen':'Bazo','splenic vein':'Vena esplénica','sternum':'Esternón','stomach':'Estómago','superior mesenteric vein':'Vena mesentérica superior','superior vena cava':'Vena cava superior','testis':'Testículo','thyroid gland':'Glándula tiroides','trachea lumen':'Luz de la tráquea','trachea':'Tráquea','transverse colon':'Colon transverso','unclassified bones':'Otros huesos (sin clasificación específica)','unclassified cartilage':'Cartílago no clasificado','unclassified muscles':'Músculos no clasificados','unclassified skin':'Piel no clasificada','unclassified tissue':'Tejido no clasificado','unclassified veins':'Venas no clasificadas','urinary bladder':'Vejiga urinaria','visceral fat':'Grasa visceral','white matter':'Sustancia blanca (médula espinal)','ascending colon':'Colon ascendente','descending colon':'Colon descendente','body of stomach':'Cuerpo del estómago','fundus of stomach':'Fondo del estómago'}
SIDE={ 'clavicle':('Clavícula','f'),'clavicular cartilage':('Cartílago clavicular','m'),'colic flexure':('Flexura cólica','f'),'external oblique':('Oblicuo externo','m'),'femur':('Fémur','m'),'hip bone':('Hueso coxal','m'),'humerus':('Húmero','m'),'iliacus':('Músculo ilíaco','m'),'internal oblique':('Oblicuo interno','m'),'jugular vein':('Vena yugular','f'),'kidney':('Riñón','m'),'lung':('Pulmón','m'),'obturator internus':('Obturador interno','m'),'psoas':('Psoas','m'),'radius':('Radio','m'),'rectus abdominis':('Recto abdominal','m'),'renal medulla':('Médula renal','f'),'renal vein':('Vena renal','f'),'scapula':('Escápula','f'),'subclavian vein':('Vena subclavia','f'),'transversus abdominis':('Transverso abdominal','m'),'ulna':('Cúbito','m'),'atrium':('Aurícula','f'),'ventricle':('Ventrículo','m') }
def translate(name):
 if name in DIRECT:return DIRECT[name]
 m=re.fullmatch(r'(cervical|thoracic|lumbar) vertebra (.+)',name)
 if m:return f"Vértebra {dict(cervical='cervical',thoracic='torácica',lumbar='lumbar')[m[1]]} {m[2]}"
 if name.startswith('intervertebral disc '):return 'Disco intervertebral '+name[19:]
 m=re.fullmatch(r'(left|right) (rib|costal cartilage) (.+)',name)
 if m:return ('Costilla' if m[2]=='rib' else 'Cartílago costal')+' '+m[3]+(' izquierdo' if m[1]=='left' else ' derecho')+('' if m[2]!='rib' else '') if m[2]!='rib' else 'Costilla '+m[3]+(' izquierda' if m[1]=='left' else ' derecha')
 m=re.fullmatch(r'(left|right) (.+)',name)
 if m and m[2] in SIDE:
  text,gender=SIDE[m[2]];side=('izquierd' if m[1]=='left' else 'derech')+('a' if gender=='f' else 'o');return text+' '+side
 for prefix,text in [('bones of the ','Huesos de la mano '),('muscles of the ','Músculos del brazo '),('skin of the ','Piel del brazo '),('unclassified tissue of the ','Tejido no clasificado del brazo ')]:
  if name.startswith(prefix):return text+(('izquierda' if 'left' in name else 'derecha') if prefix=='bones of the ' else ('izquierdo' if 'left' in name else 'derecho'))
 if name.startswith('marker '):return 'Marcador '+name.split()[-1]
 raise ValueError('Missing Spanish name: '+name)
def group(name):
 if name.startswith(('marker','unclassified','skin','visceral','white matter','grey matter')):return 'other'
 if any(s in name for s in ['vein','vena cava','aorta','arteries','pulmonary trunk']):return 'vessels'
 if any(s in name for s in ['clavicle','femur','hip bone','humerus','radius','rib ','scapula','ulna','vertebra','sternum','sacrum','coccyx','bones of','cartilage','intervertebral']):return 'bones'
 if any(s in name for s in ['oblique','iliacus','obturator','psoas','rectus','transversus','muscles','ischiocavernosus','diaphragm']):return 'muscles'
 return 'organs'
def priority(name):
 main=['liver','right lung','left lung','right kidney','left kidney','spleen','pancreas','stomach','urinary bladder','myocardium','sternum','sacrum','right femur','left femur','right humerus','left humerus','right hip bone','left hip bone']
 return main.index(name) if name in main else 30 if 'vertebra' in name else 50

def main():
 b=gzip.open(OUT/'whole-body.nii.gz','rb').read();v=np.frombuffer(b,dtype='<i2',offset=352).reshape(626,225,225)
 mask=np.zeros(v.shape,dtype=np.uint16);catalog=[];byname={};lut=np.zeros(65536,dtype=np.uint16)
 for row in openpyxl.load_workbook('/tmp/ct-sio-labels.xlsx',data_only=True).active.iter_rows(values_only=True):
  name=row[0]
  if not name:continue
  if name not in byname:
   ident=len(catalog)+1;byname[name]=ident;catalog.append({'id':ident,'name':translate(name),'original':name,'group':group(name),'source':'sio','priority':priority(name),'codes':[]})
  ident=byname[name]
  for code in row[1:]:
   if code is not None:lut[int(code)]=ident;catalog[ident-1]['codes'].append(int(code))
 xx,yy=np.meshgrid(np.arange(225),np.arange(225));mx=(287-(-280+xx*2.5)).astype('float32');my=(195-(-220+yy*2.5)).astype('float32')
 def register(k):
  num=2881-3*k
  with zipfile.ZipFile('/tmp/ct-sio.zip') as z:
   def load(folder,prefix):return np.flipud(np.array(Image.open(io.BytesIO(z.read(f'VOXEL-MAN_segmented-internal-organs/{folder}/{prefix}{num}.tif'))))).copy()
   ct=load('CT','frozenCT');lab=load('labels','labels').astype('uint16')
  src=cv2.remap(ct,mx,my,cv2.INTER_LINEAR).astype('float32')/255
  target=np.clip((v[k].astype('float32')+1024)/8,0,255)/255
  warp=np.eye(2,3,dtype='float32')
  try:score,warp=cv2.findTransformECC(target,src,warp,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,120,1e-5),None,5)
  except cv2.error:return k,None,{'slice':k,'sourceSlice':num,'accepted':False,'reason':'registration did not converge'}
  singular=np.linalg.svd(warp[:,:2],compute_uv=False)
  accepted=bool(score>=.88 and singular.min()>.85 and singular.max()<1.16 and np.max(np.abs(warp[:,2]))<20)
  result=cv2.warpAffine(cv2.remap(lut[lab],mx,my,cv2.INTER_NEAREST),warp,(225,225),flags=cv2.INTER_NEAREST|cv2.WARP_INVERSE_MAP) if accepted else None
  return k,result,{'slice':k,'sourceSlice':num,'accepted':accepted,'correlation':float(score),'affine':warp.tolist()}
 indices=[k for k in range(626) if 1256<=2881-3*k<=2029];metrics=[]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for i,(k,result,metric) in enumerate(pool.map(register,indices)):
   if result is not None:mask[k]=result
   metrics.append(metric)
   if (i+1)%50==0:print('Registered',i+1,'/',len(indices),flush=True)
 # Clearly marked morphology references extend a few unambiguous skeletal regions.
 def extra(name,original):
  ident=len(catalog)+1;catalog.append({'id':ident,'name':name,'original':original,'group':'bones','source':'morphology','priority':15,'codes':[]});return ident
 skull=extra('Huesos de la bóveda craneal','cranial vault bones')
 femurs={s:extra('Fémur '+('derecho' if s=='right' else 'izquierdo')+' (referencia)',s+' femur reference') for s in ['right','left']}
 tibias={s:extra('Tibia '+('derecha' if s=='right' else 'izquierda'),s+' tibia') for s in ['right','left']}
 fibulas={s:extra('Peroné '+('derecho' if s=='right' else 'izquierdo'),s+' fibula') for s in ['right','left']}
 feet={s:extra('Huesos del pie '+('derecho' if s=='right' else 'izquierdo'),s+' foot bones') for s in ['right','left']}
 X=-280+xx*2.5;Y=-220+yy*2.5
 for k in range(626):
  zpos=1+3*k
  if 1770<=zpos<=1870:
   bone=(v[k]>500)&(np.abs(X)<145)&(Y>-130)&(Y<180)
   mask[k][bone]=skull
  if zpos>920:continue
  for side in ['right','left']:
   roi=(X>25)&(X<190) if side=='right' else (X< -25)&(X> -190)
   bone=(v[k]>400)&roi&(Y>-195)&(Y<130)
   components,n=ndimage.label(bone);sizes=np.bincount(components.ravel());order=np.argsort(sizes[1:])[::-1]+1 if n else []
   if 680<=zpos<=910 and len(order) and 10<sizes[order[0]]<200:
    component=ndimage.binary_fill_holes(components==order[0]);mask[k][component&(mask[k]==0)]=femurs[side]
   elif 190<=zpos<=545 and len(order)>=2 and sizes[order[1]]>=2:
    for ident,label in [(order[0],tibias[side]),(order[1],fibulas[side])]:mask[k][ndimage.binary_fill_holes(components==ident)]=label
   elif zpos<=145:mask[k][bone]=feet[side]
 # Use a compact dense class label image, retaining the original CT's affine.
 h=bytearray(b[:352]);h[148:228]=bytes(80);desc=b'VOXEL-MAN SIO registered to NLM CT; educational anatomy';h[148:148+len(desc)]=desc
 assert len(catalog)<256
 struct.pack_into('<hh',h,70,2,8)
 with gzip.open(OUT/'anatomy-labels.nii.gz','wb',compresslevel=8) as f:f.write(h);f.write(mask.astype('uint8').tobytes())
 # Every label anchor is a voxel that truly belongs to its class, not a bounding-box center.
 anchors=[]
 for axis in range(3):
  planes=[]
  for k in range(mask.shape[2-axis]):
   p=mask[:,:,k] if axis==0 else mask[:,k,:] if axis==1 else mask[k]
   ids=p.ravel();valid=np.flatnonzero(ids);labs=ids[valid];A,B=np.divmod(valid,p.shape[1]);counts=np.bincount(labs,minlength=len(catalog)+1)
   sumsA=np.bincount(labs,weights=A,minlength=len(catalog)+1);sumsB=np.bincount(labs,weights=B,minlength=len(catalog)+1)
   dist=(A-sumsA[labs]/counts[labs])**2+(B-sumsB[labs]/counts[labs])**2
   mins=np.full(len(catalog)+1,np.inf);np.minimum.at(mins,labs,dist)
   chosen=np.full(len(catalog)+1,len(ids),dtype=int);winners=np.abs(dist-mins[labs])<1e-7;np.minimum.at(chosen,labs[winners],valid[winners])
   entries=[]
   for ident in np.flatnonzero(counts>=2):
    a,c=divmod(int(chosen[ident]),p.shape[1]);point=[k,c,a] if axis==0 else [c,k,a] if axis==1 else [c,a,k]
    entries.append([int(ident),*point,int(counts[ident])])
   planes.append(entries)
  anchors.append(planes)
 for obj in catalog:
  coords=np.argwhere(mask==obj['id'])
  if not len(coords):obj['count']=0;continue
  obj['count']=len(coords);obj['bounds']=[list(map(int,coords.min(0)[::-1])),list(map(int,coords.max(0)[::-1]))]
  center=coords.mean(0);q=coords[np.argmin(np.sum((coords-center)**2,axis=1))];obj['point']=list(map(int,q[::-1]))
 result={'version':1,'dimensions':[225,225,626],'origin':[-280,-220,1],'spacing':[2.5,2.5,3],'catalog':[c for c in catalog if c.get('count',0)>0],'planes':anchors,'source':{'url':'https://doi.org/10.5281/zenodo.15882019','license':'CC BY 4.0','authors':'Karl Heinz Höhne, Bernhard Pflesser, Andreas Pommert, Martin Riemer, Thomas Schiemann, Rainer Schubert, Udo Schumacher, Ulf Tiede','coverageZ':[853,1624],'sourceFileSha256':hashlib.sha256(Path('/tmp/ct-sio.zip').read_bytes()).hexdigest()},'registration':metrics,'labelVolumeSha256':hashlib.sha256((OUT/'anatomy-labels.nii.gz').read_bytes()).hexdigest()}
 META.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
 print('Catalog',len(result['catalog']),'accepted',sum(m['accepted'] for m in metrics),'/',len(metrics),'JSON bytes',META.stat().st_size,flush=True)
 # QA labelled contours on representative axial levels; no source CT data is changed.
 colors=np.array([[255,110,70],[70,205,180],[105,170,255],[255,170,220]],dtype='uint8')
 montage=Image.new('RGB',(900,900),'#101a23')
 for i,zpos in enumerate([1820,1580,1500,1380,1290,1180,1020,760,360]):
  k=round((zpos-1)/3);im=np.uint8(np.clip((v[k].astype(float)+160)/400*255,0,255));rgb=np.stack([im]*3,-1);edge=(mask[k]!=0)&(ndimage.maximum_filter(mask[k],3)!=ndimage.minimum_filter(mask[k],3));rgb[edge]=[60,220,180]
  image=Image.fromarray(rgb).transpose(Image.Transpose.FLIP_TOP_BOTTOM).resize((300,300));montage.paste(image,((i%3)*300,(i//3)*300))
 montage.save('/tmp/ct-anatomy-registration-qa.png')
if __name__=='__main__':main()
