import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
function wav(path) {
  const bytes = fs.readFileSync(path);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  let format, pcm;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = bytes.readUInt32LE(offset + 4), kind = bytes.toString('ascii', offset, offset + 4), body = offset + 8;
    if (kind === 'fmt ') format = { code: bytes.readUInt16LE(body), channels: bytes.readUInt16LE(body + 2), rate: bytes.readUInt32LE(body + 4), bits: bytes.readUInt16LE(body + 14) };
    if (kind === 'data') pcm = bytes.subarray(body, body + size);
    offset += 8 + size + size % 2;
  }
  assert.equal(format.code, 1); assert.equal(format.bits, 16); assert.ok(pcm?.length > 0);
  let squares = 0, peak = 0;
  for (let i = 0; i < pcm.length; i += 2) { const v = pcm.readInt16LE(i) / 32768; squares += v * v; peak = Math.max(peak, Math.abs(v)); }
  return { ...format, duration: pcm.length / (format.rate * format.channels * 2), rms: Math.sqrt(squares / (pcm.length / 2)), peak };
}
test('every case moment has a non-silent, unclipped ambient track and a spoken quotation', () => {
  const tracks = new Set();
  for (const c of ['depression', 'anxiety', 'claustrophobia']) for (const phase of ['context', 'experience', 'support']) {
    const path = `public/brain-explorer/audio/${c}-${phase}`;
    const bed = wav(path + '.wav'), voice = wav(path + '-voice.wav');
    assert.equal(bed.channels, 2); assert.equal(bed.duration, 12); assert.ok(bed.rms > .08); assert.ok(bed.peak < .81);
    assert.ok(voice.duration > 1 && voice.duration < 15); assert.ok(voice.rms > .05); assert.ok(voice.peak < .95);
    tracks.add(fs.readFileSync(path + '.wav').toString('base64'));
  }
  assert.ok(tracks.size >= 7, 'different cases and moments use different audio');
});
