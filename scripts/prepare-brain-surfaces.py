"""Convert Surf Ice ICBM152 MZ3 hemispheres to a compact mesh with sulcal shading.
Usage: python prepare-brain-surfaces.py left.mz3 right.mz3
Requires numpy; outputs use the original MNI vertices and triangle winding.
"""
import gzip
import struct
import sys
from pathlib import Path
import numpy as np

out = Path(__file__).resolve().parents[1] / 'public/brain-explorer'
for hemi, source in zip(['left', 'right'], sys.argv[1:]):
    raw = Path(source).read_bytes()
    if raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    magic, flags, nf, nv, skip = struct.unpack_from('<HHIII', raw)
    assert magic == 23117 and flags & 3 == 3
    faces = np.frombuffer(raw, '<u4', nf * 3, 16 + skip).reshape(-1, 3).copy()
    verts = np.frombuffer(raw, '<f4', nv * 3, 16 + skip + nf * 12).reshape(-1, 3).copy()
    normals = np.zeros_like(verts)
    fn = np.cross(verts[faces[:, 1]] - verts[faces[:, 0]], verts[faces[:, 2]] - verts[faces[:, 0]])
    for j in range(3):
        np.add.at(normals, faces[:, j], fn)
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-9)
    adjacent = np.zeros_like(verts)
    counts = np.zeros(nv)
    for a, b in [(0, 1), (1, 2), (2, 0), (1, 0), (2, 1), (0, 2)]:
        np.add.at(adjacent, faces[:, a], verts[faces[:, b]])
        np.add.at(counts, faces[:, a], 1)
    lap = adjacent / np.maximum(counts[:, None], 1) - verts
    curvature = np.sum(lap * normals, axis=1)
    shade = np.clip(.77 - curvature * 1.2, .30, 1.0).astype('<f4')
    for _ in range(2):
        smooth = np.zeros(nv)
        for a, b in [(0, 1), (1, 2), (2, 0), (1, 0), (2, 1), (0, 2)]:
            np.add.at(smooth, faces[:, a], shade[faces[:, b]])
        shade = (.5 * shade + .5 * smooth / np.maximum(counts, 1)).astype('<f4')
    (out / f'cortex-{hemi}.bin').write_bytes(struct.pack('<II', nv, nf) + verts.astype('<f4').tobytes() + faces.astype('<u4').tobytes() + shade.tobytes())
    print(hemi, nv, nf, 'bounds', verts.min(axis=0), verts.max(axis=0))
