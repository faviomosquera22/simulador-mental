import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { CARE_GUIDES, matchesCatalogQuery } from "../src/lib/paeCareSupport.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = path.resolve("src/lib/paeIntelligent.ts");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText.replace('require("./paeCareSupport")', 'require("./paeCareSupport.ts")');
const loaded = new Module(sourcePath);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(compiled, sourcePath);
const { NANDA_LIBRARY, NOC_LIBRARY, NIC_LIBRARY, suggestPaeTaxonomyBundles, getSuggestedNocOptions, getSuggestedNicOptions } = loaded.exports;

test("blank or unrelated assessment does not invent a diagnosis", () => {
  assert.deepEqual(suggestPaeTaxonomyBundles({ diagnosisText: "" }), []);
  assert.deepEqual(suggestPaeTaxonomyBundles({ diagnosisText: "Paciente de 25 años" }), []);
  assert.deepEqual(suggestPaeTaxonomyBundles({ diagnosisText: "xyzabc" }), []);
});
test("pain assessment ranks acute pain with its local teaching links", () => {
  const suggestions = suggestPaeTaxonomyBundles({ diagnosisText: "Dolor agudo pélvico EVA 8/10" });
  assert.equal(suggestions[0].nanda.code, "00132");
  assert.equal(suggestions[0].nocOptions[0].code, "2102");
  assert.equal(suggestions[0].nicOptions[0].code, "1410");
});
test("hemorrhage and poor perfusion bring fluid and perfusion diagnoses into the results", () => {
  const suggestions = suggestPaeTaxonomyBundles({ diagnosisText: "Hemorragia con sangrado, hipotension, palidez y perfusion alterada" });
  assert.ok(suggestions.some(item => item.nanda.code === "00421"));
  assert.ok(suggestions.some(item => item.nanda.code === "00204"));
});
test("explicitly denied pain is not counted as a positive finding", () => {
  assert.equal(suggestPaeTaxonomyBundles({ diagnosisText: "Paciente sin dolor" }).some(item => item.nanda.code === "00132"), false);
});
test("all local teaching links point to existing catalog codes", () => {
  for (const [code, guide] of Object.entries(CARE_GUIDES)) {
    assert.ok(NANDA_LIBRARY.some(item => item.code === code), code);
    for (const code of guide.noc) assert.ok(NOC_LIBRARY.some(item => item.code === code), `NOC ${code}`);
    for (const code of guide.nic) assert.ok(NIC_LIBRARY.some(item => item.code === code), `NIC ${code}`);
  }
});
test("search tolerates accents, multiword order, punctuation and words joined during import", () => {
  assert.equal(matchesCatalogQuery("intercambio respiratoria", ["Funcionrespiratoria:intercambiogaseoso"]), true);
  assert.equal(matchesCatalogQuery("perfusión periferica", ["Perfusion tisular: periférica"]), true);
  assert.equal(matchesCatalogQuery("0402", ["0402", "Función respiratoria"]), true);
  assert.equal(matchesCatalogQuery("dolor inexistente", ["Dolor agudo"]), false);
});
test("readable repaired labels retain the original catalog identifiers", () => {
  assert.equal(NOC_LIBRARY.find(item => item.id === "noc_0402").label, "Función respiratoria: intercambio gaseoso");
  assert.equal(NIC_LIBRARY.find(item => item.id === "nic_4026").label, "Disminución de la hemorragia: útero posparto");
});
test("an unlinked, unmatched diagnosis does not receive arbitrary first entries", () => {
  const nanda = { id: "not-present", code: "99999", label: "xyzabc", domain: "", classLabel: "", contexts: ["general"], definingCharacteristics: [], relatedFactors: [] };
  assert.deepEqual(getSuggestedNocOptions({ nanda }), []);
  assert.deepEqual(getSuggestedNicOptions({ nanda }), []);
});
