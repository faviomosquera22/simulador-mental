"""Merge matching CC0 idle/walk GLBs and resize embedded textures for web delivery.
Usage: python prepare-pap-model.py idle.glb walk.glb output.glb (requires Pillow).
Source and license: public/psychological-first-aid/ATTRIBUTION.md
"""
import copy
import io
import json
import struct
import sys
from pathlib import Path
from PIL import Image


def read(path):
    data = Path(path).read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + size]), data[28 + size:]


def main():
    idle, idle_bin = read(sys.argv[1])
    walk, walk_bin = read(sys.argv[2])
    assert [n.get('name') for n in idle['nodes']] == [n.get('name') for n in walk['nodes']]
    binary = bytearray()

    def append(data):
        binary.extend(b'\0' * (-len(binary) % 4))
        offset = len(binary)
        binary.extend(data)
        return offset

    image_views = {i['bufferView']: i for i in idle.get('images', [])}
    for index, view in enumerate(idle['bufferViews']):
        data = idle_bin[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]
        if index in image_views:
            image = Image.open(io.BytesIO(data))
            image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            image.save(output, format='PNG', optimize=True)
            data = output.getvalue()
        view['byteOffset'] = append(data)
        view['byteLength'] = len(data)

    # Copy only walk animation accessors, not a second copy of the character.
    animation = copy.deepcopy(walk['animations'][0])
    accessor_map = {}
    for sampler in animation['samplers']:
        for key in ('input', 'output'):
            old_index = sampler[key]
            if old_index not in accessor_map:
                accessor = copy.deepcopy(walk['accessors'][old_index])
                view = copy.deepcopy(walk['bufferViews'][accessor['bufferView']])
                data = walk_bin[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]
                view['byteOffset'] = append(data)
                accessor['bufferView'] = len(idle['bufferViews'])
                idle['bufferViews'].append(view)
                accessor_map[old_index] = len(idle['accessors'])
                idle['accessors'].append(accessor)
            sampler[key] = accessor_map[old_index]
    idle['animations'].append(animation)
    binary.extend(b'\0' * (-len(binary) % 4))
    idle['buffers'] = [{'byteLength': len(binary)}]
    encoded = json.dumps(idle, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    result = struct.pack('<III', 0x46546c67, 2, 28 + len(encoded) + len(binary))
    result += struct.pack('<II', len(encoded), 0x4e4f534a) + encoded
    result += struct.pack('<II', len(binary), 0x004e4942) + binary
    Path(sys.argv[3]).write_bytes(result)
    print(f'{len(result) / 1024 / 1024:.1f} MiB; idle + walk, shared mesh and textures')


if __name__ == '__main__':
    main()
