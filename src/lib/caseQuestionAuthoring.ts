import type { CaseQuestion, SourceId } from "./clinicalEducation";

export type QuestionSpec = [
  key: string, stage: CaseQuestion["stage"], prompt: string,
  options: [string, string, string, string], correct: number,
  explanation: string, triggers?: string[],
];

/** Order depends on the question ID, never the answer key; IDs survive reordering. */
export function makeCaseQuestions(caseId: string, source: SourceId, specs: QuestionSpec[]): CaseQuestion[] {
  return specs.map(([key, stage, prompt, labels, correct, explanation, triggers = []]) => {
    const id = `${caseId}:${key}`;
    const options = labels.map((label, index) => ({ id: `option-${index}`, label }));
    let seed = 2166136261;
    for (const char of id) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    for (let i = options.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { id, caseId, source, stage, prompt, options, correct: `option-${correct}`, explanation, triggers };
  });
}
