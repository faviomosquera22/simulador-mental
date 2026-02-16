// --- Self-harm guardrail (simple keyword-based detection) ---
// NOTE: This is NOT a diagnostic tool. It only flags potentially self-harm related intent
// so the simulator can switch to an educational / safety response.
export function detectSelfHarm(input: string): boolean {
  const text = (input ?? "").toLowerCase().trim();
  if (!text) return false;

  const benignContexts = [
    "cortar verduras",
    "cortar cebolla",
    "cortar papel",
    "cortar cartón",
    "cortar el pelo",
    "me corté cocinando",
    "me corté el dedo",
    "me corté la mano",
    "me corté la mano cocinando",
  ];
  if (benignContexts.some((p) => text.includes(p))) return false;

  const highSignals = [
    "suicid",
    "quitarme la vida",
    "me quiero morir",
    "no quiero vivir",
    "me voy a matar",
    "me voy a suicidar",
    "quiero suicidarme",
    "matarme",
    "hacerme daño",
    "autoles",
    "cortarme",
    "me voy a cortar",
    "me cortaría",
    "sobredosis",
    "overdose",
    "tomarme todas las pastillas",
    "tomarme muchas pastillas",
    "colgarme",
    "tirarme",
  ];

  const hitHigh = highSignals.some((p) => text.includes(p));
  if (!hitHigh) return false;

  return true;
}