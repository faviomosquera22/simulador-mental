import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { loadTypeScript } from './helpers/load-ts.cjs';
const data = JSON.parse(fs.readFileSync('public/tomography/anatomy.json', 'utf8'));
const compressed = fs.readFileSync('public/tomography/anatomy-labels.nii.gz');
const nifti = zlib.gunzipSync(compressed); const labels = nifti.subarray(352);
const { anatomyWorldPoint, anatomyVoxel, anatomyPlane, anatomyLabelAt, chooseAnatomyLabels } = loadTypeScript('src/lib/tomographyAnatomy.ts');
const at = (x, y, z) => labels[x + data.dimensions[0] * (y + data.dimensions[1] * z)];
const byId = new Map(data.catalog.map(o => [o.id, o]));

test('anatomical masks use exactly the original CT grid, affine and categorical byte labels', () => {
  assert.deepEqual(data.dimensions, [225, 225, 626]);
  assert.equal(nifti.readInt16LE(70), 2); assert.equal(nifti.readInt16LE(72), 8);
  assert.equal(labels.length, 225 * 225 * 626);
  const original = zlib.gunzipSync(fs.readFileSync('public/tomography/whole-body.nii.gz'));
  assert.deepEqual(nifti.subarray(280, 328), original.subarray(280, 328));
  assert.equal(crypto.createHash('sha256').update(compressed).digest('hex'), data.labelVolumeSha256);
  assert.ok(data.catalog.length > 150);
  for (const value of new Set(labels)) assert.ok(value === 0 || byId.has(value));
});
test('every 2D pointer terminates on its actual segmented class on the corresponding plane', () => {
  let checked = 0;
  for (let axis = 0; axis < 3; axis++) {
    assert.equal(data.planes[axis].length, data.dimensions[axis]);
    for (let slice = 0; slice < data.planes[axis].length; slice++) for (const [id, x, y, z, count] of data.planes[axis][slice]) {
      assert.equal([x, y, z][axis], slice); assert.equal(at(x, y, z), id, `${id} / ${axis} / ${slice}`);
      assert.ok(count >= 2); assert.ok(byId.has(id)); checked++;
    }
  }
  assert.ok(checked > 10000);
});
test('3D pointers are true interior voxels, with correct laterality in RAS', () => {
  for (const object of data.catalog) {
    const [x, y, z] = object.point; assert.equal(at(x, y, z), object.id, object.name);
    const mm = anatomyWorldPoint(data, object.point);
    assert.deepEqual(anatomyVoxel(data, mm), object.point);
    assert.equal(anatomyLabelAt(data, labels, mm), object.id);
  }
  for (const original of ['right kidney', 'right lung', 'right humerus', 'right tibia']) assert.ok(anatomyWorldPoint(data, data.catalog.find(o => o.original === original).point)[0] > 0, original);
  for (const original of ['left kidney', 'left lung', 'left humerus', 'left tibia']) assert.ok(anatomyWorldPoint(data, data.catalog.find(o => o.original === original).point)[0] < 0, original);
});
test('registered organ labels never extend into unsupported head/leg regions or rejected registration slices', () => {
  const accepted = new Set(data.registration.filter(m => m.accepted).map(m => m.slice));
  assert.equal(data.registration.length, 258); assert.ok(accepted.size >= 250);
  for (const result of data.registration) if (result.accepted) assert.ok(result.correlation >= .88);
  for (let z = 0; z < 626; z++) {
    if (accepted.has(z)) continue;
    const plane = labels.subarray(z * 225 * 225, (z + 1) * 225 * 225);
    for (const value of new Set(plane)) if (value) assert.equal(byId.get(value).source, 'morphology', `slice ${z}`);
  }
  for (const obj of data.catalog.filter(o => o.source === 'morphology')) assert.equal(obj.group, 'bones');
});
test('slice queries, edge bounds and group filters preserve relevant names', () => {
  assert.deepEqual(anatomyPlane(data, 2, -100), []);
  assert.equal(anatomyLabelAt(data, labels, [5000, 0, 0]), 0);
  assert.equal(anatomyLabelAt(data, labels, [NaN, 0, 0]), 0);
  const abdomen = anatomyPlane(data, 2, 1351).map(e => byId.get(e[0]));
  assert.ok(abdomen.some(o => o.name === 'Hígado'));
  const bones = chooseAnatomyLabels(abdomen, 8, ['bones']);
  assert.ok(bones.length); assert.ok(bones.every(o => o.group === 'bones'));
  assert.deepEqual(chooseAnatomyLabels(abdomen, 8, []), []);
  const both = chooseAnatomyLabels(abdomen, 8, ['bones', 'organs']);
  assert.ok(both.some(o => o.group === 'bones')); assert.ok(both.some(o => o.group === 'organs'));
});
