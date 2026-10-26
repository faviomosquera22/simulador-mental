import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { loadTypeScript } from './helpers/load-ts.cjs';
const { CT_STUDIES, CT_WINDOWS, sliceFraction, fractionSlice, axisForView, windowBounds } = loadTypeScript('src/lib/tomography.ts');
const { modulesForCareer } = loadTypeScript('src/lib/simulationCatalog.ts');
const manifest = JSON.parse(fs.readFileSync('public/tomography/manifest.json'));

test('every study has a real local volume with valid geometry, HU scale and reproducible source hash', () => {
  assert.equal(CT_STUDIES.length, 8);
  for (const study of CT_STUDIES) {
    const compressed = fs.readFileSync('public' + study.url);
    const data = zlib.gunzipSync(compressed);
    assert.equal(data.readInt32LE(0), 348);
    assert.equal(data.readInt16LE(70), 4);
    assert.equal(data.readFloatLE(112), 1);
    assert.equal(data.readFloatLE(116), 0);
    assert.equal(data.subarray(344, 348).toString(), 'n+1\0');
    const dims = [42, 44, 46].map(offset => data.readInt16LE(offset));
    assert.equal(data.length, 352 + dims.reduce((a, b) => a * b) * 2);
    const expected = study.id === 'whole-body' ? manifest : manifest.regions[study.id];
    assert.deepEqual(dims, expected.dimensionsXYZ);
    assert.equal(crypto.createHash('sha256').update(compressed).digest('hex'), expected.sha256);
    assert.ok(CT_WINDOWS.some(w => w.id === study.window));
    const values = new Set();
    for (let i = 352; i < data.length; i += 286) values.add(data.readInt16LE(i));
    assert.ok(values.size > 50, study.id + ' has anatomical intensity variation');
    assert.ok(data.includes(Buffer.from('NLM Visible Human')));
    assert.equal(data.readFloatLE(280), 2.5);
    assert.equal(data.readFloatLE(300), 2.5);
    assert.equal(data.readFloatLE(320), 3);
  }
});
test('slice navigation reaches both boundaries and round-trips every voxel center', () => {
  for (const n of [1, 85, 225, 626]) {
    for (let i = 0; i < n; i++) assert.equal(fractionSlice(sliceFraction(i, n), n), i);
    assert.equal(fractionSlice(0, n), 0);
    assert.equal(fractionSlice(1, n), n - 1);
    assert.equal(fractionSlice(sliceFraction(-10, n), n), 0);
    assert.equal(fractionSlice(sliceFraction(n + 50, n), n), n - 1);
  }
});
test('global Z uses cryosection positions and never mixes scanner series coordinates', () => {
  assert.ok(manifest.source.endsWith('/frozenCT/'));
  assert.equal(manifest.sourceSliceCount, 626);
  assert.deepEqual(manifest.missingZ, []);
  for (const r of manifest.slices) assert.equal(r.z, 2882 - Number(r.name.slice(4, 8)));
  assert.ok(manifest.zRange[1] - manifest.zRange[0] > 1800);
});
test('the window and plane controls map to their intended physical axes', () => {
  assert.equal(axisForView('axial'), 2); assert.equal(axisForView('coronal'), 1); assert.equal(axisForView('sagittal'), 0);
  assert.deepEqual(windowBounds(40, 400), [-160, 240]);
  assert.ok(windowBounds(40, 0)[1] > windowBounds(40, 0)[0]);
});
test('tomography is discoverable in Nursing and Medicine', () => {
  for (const career of ['enfermeria', 'medicina']) assert.ok(modulesForCareer(career).some(m => m.href === '/tomography-simulator'));
});
