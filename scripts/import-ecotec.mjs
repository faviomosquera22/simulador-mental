// Read-only import from the user's local Ecotec project; writes only into this project.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(process.argv[2] || '/Users/favio/Documents/CACESECOTEC-main');
const root = path.resolve(scriptDirectory, '..');
const cache = new Map();
function loadSource(file) {
  const absolute = path.resolve(file);
  if (!absolute.startsWith(source + path.sep)) throw new Error('Source path outside the selected project');
  if (cache.has(absolute)) return cache.get(absolute).exports;
  if (absolute.endsWith('.json')) return JSON.parse(fs.readFileSync(absolute, 'utf8'));
  const m = new Module(absolute); m.filename = absolute; cache.set(absolute, m);
  m.require = name => {
    if (!name.startsWith('@/')) throw new Error(`Unexpected source dependency: ${name}`);
    const target = path.join(source, 'src', name.slice(2));
    return loadSource(target.endsWith('.json') ? target : target + '.ts');
  };
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  m._compile(compiled, absolute); return m.exports;
}
const { repairQuestionText, isUsableQuestion } = loadSource(path.join(source, 'src/lib/localQuestions.ts'));
const files = ['enfermeriaQuestions.json', 'enfermeriaOctubreDocumentoQuestions.json', 'enfermeriaFundamentosDocumentoQuestions.json'];
const sourceCategories = [
  'Enfermería - Cuidado y Procedimientos Clínicos de Enfermería',
  'Enfermería - Cuidados de la Mujer, Recién Nacido, Niño y Adolescente',
  'Enfermería - Cuidados del Adulto y Adulto Mayor',
  'Enfermería - Cuidado Familiar, Comunitario e Intercultural',
  'Enfermería - Bases Educativas, Administrativas, Investigativas y Epidemiológicas',
];
const normalized = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
const records = []; const excluded = []; const duplicates = []; const seen = new Map(); const conflicts = new Set(); const assets = new Set(); const fileStats = {};
for (const file of files) {
  const rows = JSON.parse(fs.readFileSync(path.join(source, 'src/data', file), 'utf8')); fileStats[file] = rows.length;
  for (const original of rows) {
    const q = repairQuestionText(original);
    const options = ['a', 'b', 'c', 'd'].map(letter => q['option_' + letter]?.trim() ?? '');
    const component = sourceCategories.indexOf(q.category);
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(q.correct_option);
    if (component < 0 || !isUsableQuestion(q) || options.some(text => !text) || new Set(options.map(normalized)).size !== 4 || correctIndex < 0 || q.option_e?.trim()) {
      excluded.push({ id: q.id, file, reason: 'No cumple el formato de cuatro alternativas completas con clave o carece de contexto/imagen' }); continue;
    }
    const key = normalized(q.question_text) + '|' + options.map(normalized).sort().join('|');
    const answer = normalized(options[correctIndex]);
    if (seen.has(key)) {
      const prior = seen.get(key);
      if (prior.answer !== answer) { conflicts.add(key); excluded.push({ id: q.id, file, reason: 'Clave contradictoria para el mismo contenido' }); }
      else duplicates.push({ id: q.id, duplicateOf: prior.id, file });
      continue;
    }
    seen.set(key, { answer, id: q.id });
    let image = undefined;
    if (q.image_url) {
      const local = path.join(source, 'public', q.image_url);
      if (!fs.existsSync(local)) { excluded.push({ id: q.id, file, reason: 'Imagen requerida no disponible' }); continue; }
      const basename = path.basename(q.image_url); assets.add(q.image_url);
      image = { url: '/ecotec-questions/' + basename, alt: q.image_alt || 'Imagen de apoyo de la pregunta', width: q.image_width || 640, height: q.image_height || 480 };
    }
    records.push({ sourceId: q.id, sourceFile: file, sourceLabel: q.difficulty || 'Banco Ecotec', component: component + 1, question: q.question_text, options, correctAnswer: q.correct_option, explanation: q.explanation || '', ...(image ? { image } : {}), contentKey: crypto.createHash('sha256').update(key).digest('hex'), key });
  }
}
const ready = records.filter(q => !conflicts.has(q.key));
for (const q of records.filter(q => conflicts.has(q.key))) excluded.push({ id: q.sourceId, file: q.sourceFile, reason: 'Contenido con claves contradictorias; pendiente de revisión' });
const result = ready.map(q => { const row = { ...q }; delete row.key; return row; });
const target = path.join(root, 'src/lib/data/ecotecQuestions.json');
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
fs.mkdirSync(path.join(root, 'public/ecotec-questions'), { recursive: true });
for (const url of assets) fs.copyFileSync(path.join(source, 'public', url), path.join(root, 'public/ecotec-questions', path.basename(url)));
const summary = { sourceProject: 'CACESECOTEC-main', files: fileStats, imported: result.length, perComponent: sourceCategories.map((label, index) => ({ component: index + 1, label, count: result.filter(q => q.component === index + 1).length })), duplicateCount: duplicates.length, excludedCount: excluded.length, excluded, duplicates, notes: ['Se aplican las reparaciones y validaciones locales del proyecto de origen.', 'Se conservan opciones y claves explícitas; no se generan alternativas ni respuestas.', 'Las colecciones etiquetadas Componente Integral no se asignan automáticamente a los cinco componentes.'] };
fs.writeFileSync(path.join(root, 'src/lib/data/ecotecImportAudit.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ imported: summary.imported, perComponent: summary.perComponent, duplicateCount: summary.duplicateCount, excludedCount: summary.excludedCount }, null, 2));
