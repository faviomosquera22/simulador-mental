/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader for isolated TypeScript engine tests. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const cache = new Map();
function loadTypeScript(filename) {
 const file = path.resolve(filename);
 if (cache.has(file)) return cache.get(file).exports;
 const mod = { exports: {} }; cache.set(file,mod);
 const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:file})(id=>id.startsWith('.')?loadTypeScript(path.resolve(path.dirname(file),id.endsWith('.ts')?id:id+'.ts')):require(id),mod,mod.exports);
 return mod.exports;
}
module.exports = { loadTypeScript };
