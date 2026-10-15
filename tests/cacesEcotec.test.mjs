import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const filename = path.resolve("src/lib/cacesEcotec.ts");
const loaded = new Module(filename); loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { CACES_STUDY_COMPONENTS: components, CACES_ECOTEC_QUESTION_BANK: bank, mergeEcotecQuestionBank: merge } = loaded.exports;
const raw = JSON.parse(fs.readFileSync("src/lib/data/ecotecQuestions.json", "utf8"));
const audit = JSON.parse(fs.readFileSync("src/lib/data/ecotecImportAudit.json", "utf8"));

test("exactly five components contain the complete imported bank", () => {
  assert.equal(components.length, 5);
  assert.equal(bank.length, 3163);
  assert.equal(new Set(bank.map(q => q.category)).size, 5);
  for (const component of components) {
    assert.equal(bank.filter(q => q.category === component.label).length, audit.perComponent.find(row => row.component === component.id).count);
  }
});
test("every imported question preserves its explicit options and answer", () => {
  for (let i = 0; i < bank.length; i++) {
    assert.equal(bank[i].question, raw[i].question);
    assert.equal(bank[i].correctAnswer, raw[i].correctAnswer);
    assert.deepEqual(bank[i].options.map(option => option.text), raw[i].options);
    assert.equal(bank[i].source.id, raw[i].sourceId);
    assert.equal(bank[i].manualProfile, undefined);
    assert.ok(bank[i].tags.includes("dificultad_no_clasificada"));
  }
});
test("questions have four distinct alternatives and a usable answer", () => {
  for (const q of bank) {
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options.map(option => option.id)).size, 4);
    assert.equal(new Set(q.options.map(option => option.text.trim().toLowerCase())).size, 4);
    assert.ok(q.options.some(option => option.id === q.correctAnswer && option.text.trim()));
  }
});
test("stable progress groups and IDs do not collide", () => {
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  assert.equal(new Set(bank.map(q => q.sourceGroup)).size, bank.length);
});
test("the optional AI cache cannot restore removed category groups", () => {
  const example = { ...bank[0], id: "old-cache", question: "Una pregunta diferente para el banco anterior", category: "Score MAMÁ" };
  assert.equal(merge([example]).length, bank.length);
});
test("the source answer takes precedence over a duplicate from AI cache", () => {
  const example = { ...bank[0], id: "ai-duplicate", correctAnswer: bank[0].correctAnswer === "A" ? "B" : "A" };
  const combined = merge([example]);
  assert.equal(combined.length, bank.length);
  assert.equal(combined[0].correctAnswer, bank[0].correctAnswer);
});
test("required question images are bundled locally", () => {
  const images = bank.filter(q => q.image);
  assert.ok(images.length > 0);
  for (const q of images) {
    assert.ok(q.image.url.startsWith("/ecotec-questions/"));
    assert.ok(fs.existsSync(path.join("public", q.image.url)));
    assert.ok(q.image.alt.length > 0);
  }
});
test("the import audit accounts for every record in the selected files", () => {
  assert.equal(Object.values(audit.files).reduce((sum, value) => sum + value, 0), audit.imported + audit.duplicateCount + audit.excludedCount);
});
