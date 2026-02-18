

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";

export type DxCategory =
  | "Ánimo"
  | "Ansiedad"
  | "Trauma"
  | "Psicóticos"
  | "Sustancias"
  | "Personalidad"
  | "Neurodesarrollo"
  | "Sueño";

export type Dx = {
  id: string; // slug corto (para ?dx=)
  name: string;
  category: DxCategory;
  keywords: string[];
  quick: {
    definition: string;
    typical: string;
  };
  dsm5: {
    core: string[]; // checklist corto
    duration?: string;
    specifiers?: string[];
  };
  differentials: string[];
  redFlags: string[];
  questions: string[];
  initialCare: string[];
};

// Datos iniciales (mínimos, editables). No es el DSM-5 textual: es una guía resumida para estudio/uso en simulador.
export const DX: Dx[] = [
  {
    id: "mdd",
    name: "Trastorno depresivo mayor (TDM)",
    category: "Ánimo",
    keywords: ["depresión", "anhedonia", "tristeza", "mdd", "tdm"],
    quick: {
      definition:
        "Episodio de ánimo deprimido o anhedonia con impacto funcional y síntomas asociados.",
      typical:
        "Baja energía, alteraciones de sueño/apetito, culpa, enlentecimiento o agitación; puede haber ideación suicida.",
    },
    dsm5: {
      core: [
        "≥5 síntomas, casi todos los días",
        "Incluye ánimo deprimido y/o anhedonia",
        "Deterioro funcional",
        "No atribuible a sustancias/condición médica",
      ],
      duration: "≥2 semanas",
      specifiers: ["con ansiedad", "melancólico", "atípico", "con características psicóticas"],
    },
    differentials: [
      "Duelo vs TDM (persistencia, culpa, ideación suicida, deterioro)",
      "Trastorno bipolar (historia de manía/hipomanía)",
      "Hipotiroidismo/anemia/efectos de fármacos",
      "Trastorno depresivo persistente",
    ],
    redFlags: [
      "Ideación/plan suicida, intento previo",
      "Síntomas psicóticos",
      "Catatonía o deterioro grave (no come/no bebe)",
    ],
    questions: [
      "¿Qué tanto disfrutas hoy lo que antes te gustaba?",
      "¿Cómo están tu sueño y tu apetito?",
      "¿Has sentido culpa excesiva o que no vales nada?",
      "¿Te cuesta concentrarte o tomar decisiones?",
      "Pregunta de seguridad: ¿has pensado en hacerte daño? ¿tienes un plan?",
    ],
    initialCare: [
      "Evaluar riesgo suicida y red flags; derivación urgente si aplica",
      "Psicoeducación + plan de apoyo (red de soporte)",
      "Higiene del sueño, activación conductual básica",
      "Coordinar evaluación médica si sospecha orgánica",
    ],
  },
  {
    id: "gad",
    name: "Trastorno de ansiedad generalizada (TAG)",
    category: "Ansiedad",
    keywords: ["ansiedad", "preocupación", "nervios", "gad", "tag"],
    quick: {
      definition:
        "Preocupación excesiva y difícil de controlar sobre múltiples áreas, con síntomas somáticos/cognitivos.",
      typical:
        "Inquietud, fatigabilidad, tensión muscular, irritabilidad, problemas de sueño y concentración.",
    },
    dsm5: {
      core: [
        "Preocupación excesiva y persistente",
        "Difícil de controlar",
        "Síntomas físicos/cognitivos asociados",
        "Deterioro funcional",
      ],
      duration: "≥6 meses",
    },
    differentials: [
      "Trastorno de pánico",
      "Hipertiroidismo/intoxicación por estimulantes",
      "TEPT",
      "Ansiedad por enfermedad",
    ],
    redFlags: ["Dolor torácico/síncope (descartar orgánico)", "Uso de sustancias", "Ideación suicida por desesperanza"],
    questions: [
      "¿Cuánto tiempo al día te ocupan las preocupaciones?",
      "¿Qué tan difícil es parar esos pensamientos?",
      "¿Dónde lo sientes en el cuerpo (tensión, palpitaciones, dolor)?",
      "¿Cómo afecta tu estudio/trabajo/sueño?",
    ],
    initialCare: [
      "Técnicas breves: respiración diafragmática, grounding",
      "Identificar disparadores y patrones de evitación",
      "Higiene del sueño; limitar cafeína/energizantes",
      "Derivar si hay comorbilidad grave o riesgo",
    ],
  },
  {
    id: "panic",
    name: "Trastorno de pánico",
    category: "Ansiedad",
    keywords: ["pánico", "crisis", "ataque", "panic"],
    quick: {
      definition:
        "Ataques de pánico recurrentes e inesperados + preocupación persistente o cambios conductuales.",
      typical:
        "Palpitaciones, disnea, temblor, miedo a morir/volverse loco; evitación de lugares.",
    },
    dsm5: {
      core: [
        "Ataques de pánico inesperados y recurrentes",
        "≥1 mes de preocupación por nuevos ataques y/o evitación",
        "No explicado mejor por sustancia/condición médica",
      ],
    },
    differentials: ["Arritmias/asma/hipoglucemia", "TEPT", "Fobia específica/social"],
    redFlags: ["Primer ataque con síntomas cardiopulmonares intensos", "Uso de cocaína/anfetaminas", "Síncope"],
    questions: [
      "¿Qué síntomas aparecen primero? ¿cuánto dura el pico?",
      "¿Qué temes que pase durante el ataque?",
      "¿Evitas lugares por miedo a otro ataque?",
    ],
    initialCare: [
      "Descartar causas médicas si es primer episodio o atípico",
      "Psicoeducación: curva del pánico y reatribución",
      "Respiración/grounding; exposición gradual con guía profesional",
    ],
  },
  {
    id: "ptsd",
    name: "Trastorno de estrés postraumático (TEPT)",
    category: "Trauma",
    keywords: ["trauma", "tept", "flashbacks", "pesadillas", "ptsd"],
    quick: {
      definition:
        "Síntomas intrusivos + evitación + cambios cognitivo/afectivos + hiperactivación tras un evento traumático.",
      typical:
        "Pesadillas, recuerdos intrusivos, hipervigilancia, irritabilidad, anestesia emocional.",
    },
    dsm5: {
      core: [
        "Exposición a trauma",
        "Intrusiones (recuerdos, pesadillas, flashbacks)",
        "Evitación",
        "Cambios negativos en cognición/ánimo",
        "Hiperactivación",
        "Deterioro funcional",
      ],
      duration: ">1 mes",
    },
    differentials: ["Trastorno de adaptación", "Trastorno de pánico", "Depresión mayor"],
    redFlags: ["Disociación severa", "Riesgo suicida", "Violencia en curso"],
    questions: [
      "¿Hay recuerdos que llegan sin querer?",
      "¿Qué cosas evitas para no recordar?",
      "¿Te sientes en guardia todo el tiempo?",
      "Seguridad: ¿sigues expuesto/a al peligro?",
    ],
    initialCare: [
      "Priorizar seguridad (riesgo actual, violencia)",
      "Grounding y estabilización antes de exposición a trauma",
      "Plan de apoyo + derivación a terapia enfocada en trauma",
    ],
  },
  {
    id: "bipolar1",
    name: "Trastorno bipolar I (episodio maníaco)",
    category: "Ánimo",
    keywords: ["manía", "bipolar", "bipolar1", "euforia"],
    quick: {
      definition:
        "Episodio maníaco (ánimo elevado/irritable) con aumento de energía y deterioro marcado o psicosis.",
      typical:
        "Menos sueño, verborrea, grandiosidad, impulsividad (gastos/sexo), conductas de riesgo.",
    },
    dsm5: {
      core: [
        "Ánimo elevado/irritable + ↑ energía",
        "Síntomas: grandiosidad, ↓ sueño, verborrea, fuga de ideas, distractibilidad, ↑ actividad, conductas riesgosas",
        "Deterioro marcado / hospitalización / psicosis",
      ],
      duration: "≥1 semana (o cualquier duración si hospitalización)",
    },
    differentials: ["Sustancias (cocaína/anfetaminas)", "Hipertiroidismo", "TDAH", "Trastorno límite"],
    redFlags: ["Psicosis", "Conductas de alto riesgo", "Agitación severa", "Falta total de sueño"],
    questions: [
      "¿Cuántas horas duermes y cómo te sientes al despertar?",
      "¿Has tenido periodos con energía ‘inagotable’?",
      "¿Gastos/decisiones impulsivas recientes?",
      "¿Alguien te ha dicho que hablas más rápido de lo normal?",
    ],
    initialCare: [
      "Evaluación urgente si manía probable (riesgo/psicosis)",
      "Reducir estímulos; apoyo familiar si es seguro",
      "Derivación médica/psiquiatría",
    ],
  },
  {
    id: "psychosis",
    name: "Psicosis / Espectro esquizofrenia (screening)",
    category: "Psicóticos",
    keywords: ["psicosis", "alucinaciones", "delirios", "esquizofrenia"],
    quick: {
      definition:
        "Síntomas psicóticos (delirios, alucinaciones, pensamiento desorganizado) con impacto funcional.",
      typical:
        "Voces, ideas persecutorias, conducta extraña, aislamiento, deterioro progresivo.",
    },
    dsm5: {
      core: [
        "Delirios y/o alucinaciones y/o lenguaje desorganizado",
        "Deterioro social/ocupacional",
        "Descartar sustancias/condición médica",
      ],
    },
    differentials: ["Trastorno bipolar/depresión con psicosis", "Intoxicación/abstinencia", "Delirium"],
    redFlags: ["Comando alucinatorio", "Ideas de daño a otros", "Delirium (inicio agudo, fluctuante)"],
    questions: [
      "¿Has escuchado o visto cosas que otros no perciben?",
      "¿Sientes que te vigilan o te quieren hacer daño?",
      "¿Te han ordenado hacer algo?",
      "¿Consumes alcohol/drogas? ¿cuándo fue la última vez?",
    ],
    initialCare: [
      "Priorizar seguridad: riesgo auto/heteroagresivo",
      "Evaluación médica si inicio agudo o sospecha de delirium",
      "Derivación urgente a salud mental",
    ],
  },
  {
    id: "aud",
    name: "Trastorno por consumo de alcohol (AUD)",
    category: "Sustancias",
    keywords: ["alcohol", "consumo", "dependencia", "aud"],
    quick: {
      definition:
        "Patrón problemático de consumo con deterioro, tolerancia/abstinencia o pérdida de control.",
      typical:
        "Aumento de cantidad, fallas en responsabilidades, consumo pese a consecuencias, craving.",
    },
    dsm5: {
      core: [
        "Pérdida de control / craving",
        "Deterioro social/ocupacional",
        "Uso riesgoso",
        "Tolerancia y/o abstinencia",
      ],
    },
    differentials: ["Consumo social", "Trastorno depresivo con automedicación", "Otras sustancias"],
    redFlags: ["Abstinencia severa (temblor, delirium)", "Ideación suicida", "Violencia"],
    questions: [
      "¿Cuántos días a la semana tomas y cuánto?",
      "¿Has intentado bajar y no has podido?",
      "¿Has tenido abstinencia (temblor, sudor, ansiedad) al dejarlo?",
      "¿Te ha traído problemas en casa/estudio/trabajo?",
    ],
    initialCare: [
      "Tamizaje (AUDIT-C) + entrevista motivacional breve",
      "Plan de reducción/abstinencia con apoyo",
      "Derivar si abstinencia probable o comorbilidad grave",
    ],
  },
  {
    id: "insomnia",
    name: "Trastorno de insomnio",
    category: "Sueño",
    keywords: ["insomnio", "sueño", "no duermo"],
    quick: {
      definition:
        "Dificultad para iniciar/mantener el sueño o despertar precoz con malestar o deterioro.",
      typical:
        "Somnolencia diurna, irritabilidad, mala concentración; a veces asociado a ansiedad/depresión.",
    },
    dsm5: {
      core: ["Problema de sueño", "Malestar/deterioro", "Ocurre pese a oportunidad de dormir"],
      duration: "≥3 meses (crónico) / ≥3 noches por semana",
    },
    differentials: ["Apnea del sueño", "Uso de cafeína/estimulantes", "Depresión/ansiedad"],
    redFlags: ["Ronquidos + pausas respiratorias", "Somnolencia extrema", "Uso de sedantes"],
    questions: [
      "¿Cuánto tardas en dormirte? ¿cuántas veces despiertas?",
      "¿Qué haces 2 horas antes de dormir?",
      "¿Cafeína/energizantes? ¿a qué hora?",
      "¿Roncas o te han visto dejar de respirar?",
    ],
    initialCare: [
      "Higiene del sueño (horario fijo, luz, pantallas)",
      "Control de estímulos y restricción del sueño (si aplica)",
      "Evaluar comorbilidades y derivar si apnea probable",
    ],
  },
];

export const CATEGORIES: DxCategory[] = [
  "Ánimo",
  "Ansiedad",
  "Trauma",
  "Psicóticos",
  "Sustancias",
  "Personalidad",
  "Neurodesarrollo",
  "Sueño",
];

function getDxFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("dx");
}

function setDxInUrl(dxId: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("dx", dxId);
  window.history.replaceState({}, "", url.toString());
}

export default function Page() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DxCategory | "Todas">("Todas");
  const [activeId, setActiveId] = useState<string>(DX[0]?.id ?? "mdd");
  const [tab, setTab] = useState<"Resumen" | "DSM-5" | "Diferenciales" | "Red flags" | "Preguntas" | "Manejo">("Resumen");

  // Selección inicial por URL (?dx=)
  useEffect(() => {
    const dx = getDxFromUrl();
    if (!dx) return;
    const exists = DX.some((d) => d.id === dx);
    if (exists) setActiveId(dx);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DX.filter((d) => {
      const catOk = category === "Todas" ? true : d.category === category;
      if (!catOk) return false;
      if (!q) return true;
      const hay = `${d.name} ${d.category} ${d.keywords.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  const active = useMemo(() => {
    return DX.find((d) => d.id === activeId) ?? filtered[0] ?? DX[0];
  }, [activeId, filtered]);

  useEffect(() => {
    if (!active?.id) return;
    setDxInUrl(active.id);
  }, [active?.id]);

  useEffect(() => {
    // si el filtro dejó fuera el active, selecciona el primero
    if (!active) return;
    const inFiltered = filtered.some((d) => d.id === active.id);
    if (!inFiltered && filtered[0]) setActiveId(filtered[0].id);
  }, [filtered, active]);

  return (
    <div className="min-h-screen bg-[#070A0F]">
      <div className="mx-auto flex max-w-[1480px] gap-6 px-4 py-6">
        <Sidebar />

        <main className="flex-1 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Biblioteca clínica</h1>
              <p className="mt-1 text-sm text-white/70">
                DSM-5 en versión práctica: rápido, claro y listo para el simulador.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/cases"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Biblioteca de casos
              </Link>
              <Link
                href="/history"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
              >
                Historial
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-5">
            {/* Left: search + list */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca: depresión, pánico, TEPT…"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategory("Todas")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      category === "Todas"
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Todas
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        category === c
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    No hay coincidencias. Prueba con otra palabra.
                  </div>
                ) : (
                  filtered.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setActiveId(d.id);
                        setTab("Resumen");
                      }}
                      className={`w-full text-left rounded-xl border p-4 transition ${
                        active?.id === d.id
                          ? "border-white/25 bg-white/10"
                          : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="text-xs text-white/60">{d.category}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{d.name}</div>
                      <div className="mt-1 text-xs text-white/60 line-clamp-2">{d.quick.definition}</div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                Tip: puedes abrir una ficha directo con <span className="text-white">/topics?dx=gad</span>.
              </div>
            </section>

            {/* Right: details */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {!active ? (
                <div className="text-sm text-white/70">Selecciona un tema a la izquierda.</div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-white/60">{active.category}</div>
                      <h2 className="mt-1 text-xl font-semibold text-white">{active.name}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(window.location.href);
                          } catch {}
                        }}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
                      >
                        Copiar link
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      [
                        "Resumen",
                        "DSM-5",
                        "Diferenciales",
                        "Red flags",
                        "Preguntas",
                        "Manejo",
                      ] as const
                    ).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          tab === t
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/10 bg-black/20 text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                    {tab === "Resumen" && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-white/60">Definición</div>
                          <div className="mt-1 text-sm text-white/85">{active.quick.definition}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Presentación típica</div>
                          <div className="mt-1 text-sm text-white/85">{active.quick.typical}</div>
                        </div>
                      </div>
                    )}

                    {tab === "DSM-5" && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-white/60">Checklist núcleo</div>
                          <ul className="mt-2 space-y-2 text-sm text-white/85 list-disc pl-5">
                            {active.dsm5.core.map((x, i) => (
                              <li key={i}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        {active.dsm5.duration && (
                          <div>
                            <div className="text-xs text-white/60">Duración</div>
                            <div className="mt-1 text-sm text-white/85">{active.dsm5.duration}</div>
                          </div>
                        )}
                        {!!active.dsm5.specifiers?.length && (
                          <div>
                            <div className="text-xs text-white/60">Especificadores frecuentes</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {active.dsm5.specifiers.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/75"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-white/50">
                          Nota: Esto es un resumen para estudio/uso clínico simulado. No reemplaza evaluación profesional.
                        </div>
                      </div>
                    )}

                    {tab === "Diferenciales" && (
                      <div>
                        <div className="text-xs text-white/60">Diferenciales clave</div>
                        <ul className="mt-2 space-y-2 text-sm text-white/85 list-disc pl-5">
                          {active.differentials.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tab === "Red flags" && (
                      <div>
                        <div className="text-xs text-white/60">Banderas rojas</div>
                        <ul className="mt-2 space-y-2 text-sm text-white/85 list-disc pl-5">
                          {active.redFlags.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/75">
                          Si aparece una bandera roja, tu objetivo cambia: primero seguridad, luego entrevista.
                        </div>
                      </div>
                    )}

                    {tab === "Preguntas" && (
                      <div>
                        <div className="text-xs text-white/60">Preguntas sugeridas (entrevista)</div>
                        <ul className="mt-2 space-y-2 text-sm text-white/85 list-disc pl-5">
                          {active.questions.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tab === "Manejo" && (
                      <div>
                        <div className="text-xs text-white/60">Manejo inicial (primeros pasos)</div>
                        <ul className="mt-2 space-y-2 text-sm text-white/85 list-disc pl-5">
                          {active.initialCare.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                        <div className="mt-4 text-xs text-white/50">
                          Próximo paso: conectar esta ficha con cada caso (meta.dsm_tag) para abrirla desde el simulador en 1 clic.
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}