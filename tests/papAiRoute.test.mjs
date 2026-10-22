import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { loadTypeScript } from './helpers/load-ts.cjs';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const pap = loadTypeScript('src/lib/papAi.ts');
const { createPapRun } = loadTypeScript('src/lib/psychologicalFirstAid.ts');
const body = () => ({ run: { ...createPapRun(), status: 'running' }, message: '¿Qué necesitas?', kind: 'speech' });
function route({ auth = true, limited = false, configured = true, output = { intent: 'needs', message: 'Quiero saber de mi hermana.' }, fail = false } = {}) {
  const calls = [];
  const guardCalls = [];
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('app/api/ai/pap-turn/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const deps = {
    '@/src/lib/papAi': pap,
    '@/src/lib/serverGuards': { requireAuthenticatedUser: async () => auth ? { ok: true, data: { userId: 'student-test' } } : { ok: false, response: Response.json({ code: 'UNAUTHORIZED' }, { status: 401 }) }, enforceRateLimit: options => { guardCalls.push(options); return limited ? { ok: false, response: Response.json({ code: 'RATE_LIMIT' }, { status: 429 }) } : { ok: true }; } },
    '@/src/lib/ai/geminiFallback': { generateJsonWithGeminiFallback: async options => { calls.push(options); if (fail) throw new Error('private-provider-error'); return { output, modelUsed: 'test-model' }; } },
  };
  vm.runInNewContext(`(function(require,module,exports,process){${code}\n})`, { Response, Request, console })(id => deps[id] ?? require(id), mod, mod.exports, { env: configured ? { GEMINI_API_KEY: 'test-not-a-real-key' } : {} });
  return { post: data => mod.exports.POST(new Request('http://localhost/api/ai/pap-turn', { method: 'POST', body: typeof data === 'string' ? data : JSON.stringify(data) })), calls, guardCalls };
}
test('PAP endpoint rejects unauthenticated and rate-limited calls before invoking Gemini', async () => {
  for (const [options, status] of [[{ auth: false }, 401], [{ limited: true }, 429]]) {
    const api = route(options);
    assert.equal((await api.post(body())).status, status);
    assert.equal(api.calls.length, 0);
  }
});
test('missing configuration and malformed or oversized requests never invoke Gemini', async () => {
  const unavailable = route({ configured: false });
  assert.equal((await unavailable.post(body())).status, 503);
  const invalid = route();
  assert.equal((await invalid.post('{broken')).status, 400);
  assert.equal((await invalid.post({ ...body(), message: 'x'.repeat(701) })).status, 400);
  assert.equal((await invalid.post('x'.repeat(40001))).status, 413);
  assert.equal(invalid.calls.length + unavailable.calls.length, 0);
});
test('valid endpoint uses the shared provider, structured schema and bounded context', async () => {
  const api = route();
  const response = await api.post(body());
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(data.provider, 'gemini');
  assert.equal(data.turn.message, 'Quiero saber de mi hermana.');
  assert.equal(api.calls[0].generationConfig.responseMimeType, 'application/json');
  assert.deepEqual(Array.from(api.calls[0].generationConfig.responseSchema.required), ['intent', 'message']);
  assert.equal(api.guardCalls[0].limit, 20);
});
test('invalid provider output and provider exceptions have bounded, non-sensitive errors', async () => {
  for (const options of [{ output: { intent: 'complete-everything', message: 'No' } }, { fail: true }]) {
    const api = route(options);
    const response = await api.post(body());
    assert.equal(response.status, 503);
    const text = await response.text();
    assert.doesNotMatch(text, /private-provider-error|test-not-a-real-key|stack/);
  }
});
