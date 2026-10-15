/** Local teaching aids, independently authored. These are NOT official NNN linkages or taxonomy definitions. */
export type CareGuide = { terms: string[]; observations: string[]; noc: string[]; nic: string[] };
export const CARE_GUIDES: Record<string, CareGuide> = {
  "00132": { terms: ["dolor", "dolor agudo", "dolor pelvico", "dolor abdominal", "eva", "escala del dolor"], observations: ["Valorar localización, intensidad y evolución del dolor", "Registrar la repercusión del dolor en el descanso y la movilidad"], noc: ["2102", "1605"], nic: ["1410"] },
  "00133": { terms: ["dolor cronico", "dolor persistente"], observations: ["Explorar duración y repercusión funcional del dolor"], noc: ["2102", "1605"], nic: ["1415"] },
  "00421": { terms: ["hemorragia", "sangrado", "hipovolemia", "deshidratacion", "perdida de liquidos", "hipotension", "mucosas secas"], observations: ["Cuantificar pérdidas y valorar perfusión", "Registrar balance y tendencia hemodinámica"], noc: ["0602", "0601"], nic: ["4120", "4130", "4020"] },
  "00420": { terms: ["riesgo de deshidratacion", "riesgo de hipovolemia", "riesgo de perdida de liquidos"], observations: ["Identificar factores de riesgo de pérdida de líquidos"], noc: ["0602", "0601"], nic: ["4130", "4120"] },
  "00026": { terms: ["edema", "sobrecarga", "retencion de liquidos", "hipervolemia"], observations: ["Registrar balance, peso y signos de congestión"], noc: ["0601", "0603"], nic: ["4130", "4120"] },
  "00030": { terms: ["hipoxemia", "hipoxia", "saturacion baja", "spo2", "intercambio gaseoso", "desaturacion"], observations: ["Registrar saturación, trabajo respiratorio y estado de conciencia"], noc: ["0402", "0403"], nic: ["3350", "3320"] },
  "00031": { terms: ["secreciones", "tos ineficaz", "vias respiratorias", "expectoracion"], observations: ["Valorar eficacia de la tos y características de las secreciones"], noc: ["0410", "0403"], nic: ["3140", "3350"] },
  "00032": { terms: ["disnea", "taquipnea", "patron respiratorio", "respiracion superficial"], observations: ["Observar frecuencia, profundidad y esfuerzo respiratorio"], noc: ["0403", "0402"], nic: ["3350", "3140"] },
  "00007": { terms: ["fiebre", "hipertermia", "temperatura elevada", "febril"], observations: ["Medir y registrar la tendencia de temperatura y el estado general"], noc: ["0800", "0703"], nic: ["3786", "3900"] },
  "00004": { terms: ["riesgo de infeccion", "procedimiento invasivo", "cateter", "inmunosupresion", "herida quirurgica"], observations: ["Identificar exposición y factores que aumentan la susceptibilidad a infección"], noc: ["1924"], nic: ["6550", "6540"] },
  "00204": { terms: ["perfusion", "relleno capilar", "pulsos debiles", "extremidades frias", "palidez"], observations: ["Comparar perfusión periférica, pulsos y temperatura de extremidades"], noc: ["0407", "0422"], nic: ["6680", "4130"] },
  "00400": { terms: ["ansiedad", "angustia", "inquietud", "preocupacion excesiva"], observations: ["Explorar preocupaciones y recursos de afrontamiento con escucha activa"], noc: ["1211"], nic: ["5820"] },
  "00046": { terms: ["lesion cutanea", "ulcera", "piel lesionada", "herida", "integridad cutanea"], observations: ["Describir ubicación, dimensiones y evolución de la lesión"], noc: ["1101"], nic: ["3590", "3660"] },
  "00085": { terms: ["movilidad reducida", "movilidad deteriorada", "dificultad para caminar", "inmovilidad"], observations: ["Valorar movilidad, tolerancia y necesidad de ayuda"], noc: ["0208"], nic: ["0840", "0221"] },
};
export const TEACHING_INDICATORS: Record<string, string[]> = {
  "2102": ["Intensidad del dolor referida por la persona", "Interferencia del dolor con el descanso", "Interferencia del dolor con la movilidad"],
  "1605": ["Comunicación oportuna del dolor", "Uso de estrategias de alivio acordadas", "Reconocimiento de situaciones que agravan el dolor"],
  "0602": ["Humedad de mucosas en la valoración", "Tendencia de diuresis según contexto clínico", "Tolerancia a la reposición indicada"],
  "0601": ["Concordancia entre ingresos y pérdidas registradas", "Tendencia de peso y balance", "Evolución de signos de déficit o sobrecarga"],
  "0603": ["Evolución de edema", "Tolerancia respiratoria", "Tendencia del balance acumulado"],
  "0402": ["Tendencia de saturación frente al objetivo acordado", "Estado de conciencia", "Signos de esfuerzo respiratorio"],
  "0403": ["Frecuencia respiratoria frente al objetivo", "Profundidad y regularidad respiratoria", "Tolerancia a la actividad"],
  "0410": ["Capacidad para movilizar secreciones", "Eficacia de la tos", "Signos de obstrucción de vía aérea"],
  "0800": ["Temperatura frente al objetivo acordado", "Confort referido", "Tolerancia a las medidas indicadas"],
  "0703": ["Tendencia de signos locales de infección", "Evolución del estado general", "Respuesta a las medidas prescritas"],
  "1924": ["Reconocimiento de factores de riesgo", "Participación en medidas de prevención", "Comunicación de signos de alarma"],
  "0407": ["Tendencia del relleno capilar", "Temperatura de extremidades", "Características de los pulsos periféricos"],
  "0422": ["Tendencia de perfusión periférica", "Evolución del estado mental", "Tendencia de diuresis"],
  "1211": ["Intensidad de preocupación referida", "Capacidad para expresar necesidades", "Participación en decisiones acordadas"],
  "1101": ["Evolución de la lesión descrita", "Integridad de piel circundante", "Ausencia de lesiones nuevas"],
  "0208": ["Movilidad respecto al estado inicial", "Tolerancia a los cambios de posición", "Nivel de ayuda requerido"],
};
export const TEACHING_ACTIVITIES: Record<string, string[]> = {
  "1410": ["Valorar dolor con una escala apropiada y registrar localización e intensidad.", "Acordar medidas de confort y reevaluar su respuesta.", "Verificar la prescripción analgésica, alergias y respuesta al tratamiento."],
  "1415": ["Explorar cómo el dolor afecta las actividades habituales.", "Acordar objetivos funcionales y medidas de alivio.", "Registrar respuesta y coordinar continuidad del cuidado."],
  "4120": ["Registrar ingresos y pérdidas con el método disponible.", "Reevaluar perfusión y tolerancia al soporte indicado.", "Comunicar signos de déficit o sobrecarga al equipo."],
  "4130": ["Mantener balance de ingresos y egresos.", "Comparar tendencias de peso, diuresis y estado circulatorio.", "Comunicar cambios relevantes de manera estructurada."],
  "4020": ["Cuantificar las pérdidas visibles y registrar su evolución.", "Activar ayuda ante signos de compromiso circulatorio.", "Preparar las medidas de control indicadas por el equipo."],
  "3350": ["Medir frecuencia respiratoria, saturación y esfuerzo ventilatorio.", "Comparar hallazgos con objetivos individualizados.", "Escalar cambios del estado respiratorio de forma oportuna."],
  "3320": ["Verificar indicación, dispositivo y objetivo de saturación.", "Vigilar la tolerancia y respuesta al oxígeno.", "Reevaluar la necesidad de soporte y comunicar deterioro."],
  "3140": ["Valorar permeabilidad de vía aérea y capacidad para manejar secreciones.", "Facilitar una posición que favorezca la ventilación.", "Preparar apoyo y comunicar signos de obstrucción."],
  "3786": ["Registrar temperatura, confort y evolución del estado general.", "Aplicar medidas de confort y el tratamiento prescrito.", "Reevaluar la respuesta y comunicar signos de deterioro."],
  "3900": ["Monitorizar temperatura con método consistente.", "Ajustar las medidas ambientales al confort de la persona.", "Documentar la respuesta a las medidas indicadas."],
  "6550": ["Identificar susceptibilidad y factores de exposición.", "Aplicar medidas preventivas pertinentes al contexto.", "Enseñar signos que requieren reevaluación."],
  "6540": ["Aplicar higiene de manos y precauciones pertinentes.", "Mantener técnica adecuada durante los procedimientos.", "Vigilar signos de infección y comunicar cambios."],
  "6680": ["Registrar signos vitales y sus tendencias.", "Relacionar los cambios con síntomas y perfusión.", "Comunicar hallazgos relevantes con prioridades claras."],
  "5820": ["Explicar los procedimientos con lenguaje claro.", "Escuchar preocupaciones y ofrecer decisiones compartidas.", "Reevaluar la ansiedad y el efecto del acompañamiento."],
  "3590": ["Inspeccionar la piel con privacidad y consentimiento.", "Registrar características y evolución de las lesiones.", "Comunicar cambios y acordar medidas de protección."],
  "3660": ["Valorar y documentar la lesión con técnica apropiada.", "Realizar el cuidado indicado según protocolo.", "Reevaluar tolerancia y evolución de la herida."],
  "0840": ["Valorar tolerancia y necesidad de ayuda para movilizarse.", "Acordar cambios de posición seguros.", "Registrar respuesta y proteger puntos de presión."],
  "0221": ["Valorar seguridad antes de la deambulación.", "Acompañar la movilidad con la ayuda necesaria.", "Reevaluar la tolerancia y el riesgo de caídas."],
};
export function normalizeCatalogSearch(value: string) {
  return String(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
export function matchesCatalogQuery(query: string, fields: string[]) {
  const terms = normalizeCatalogSearch(query).split(/\s+/).filter(Boolean);
  const text = normalizeCatalogSearch(fields.join(" "));
  const compact = text.replace(/\s/g, "");
  return terms.every(term => text.includes(term) || compact.includes(term));
}
const LABEL_REPAIRS: Record<string, Record<string, string>> = {
  noc: { "0402": "Función respiratoria: intercambio gaseoso", "0410": "Función respiratoria: permeabilidad de las vías respiratorias", "1101": "Integridad tisular: piel y membranas mucosas", "0602": "Hidratación", "0601": "Equilibrio hídrico", "0407": "Perfusión tisular: periférica", "1402": "Autocontrol de la ansiedad", "0415": "Función respiratoria" },
  nic: { "4026": "Disminución de la hemorragia: útero posparto", "4022": "Disminución de la hemorragia: digestiva", "3350": "Monitorización respiratoria", "4120": "Manejo de líquidos", "4130": "Monitorización de líquidos", "1410": "Manejo del dolor: agudo", "3786": "Manejo de la hipertermia" },
};
export function cleanTaxonomyLabel(kind: string, code: string, label: string) {
  return LABEL_REPAIRS[kind]?.[code] ?? label.replace(/^(?:Wilkins|Bartlett)\.\s*/i, "").replace(/:\s*/g, ": ").replace(/\s+/g, " ").trim();
}
