import { makeCaseQuestions } from "./caseQuestionAuthoring";
import { additionalObstetricQuestions } from "./obstetricQuestions";
import type { CaseQuestion } from "./clinicalEducation";

export function buildClinicalQuestions(): CaseQuestion[] {
 return [
  ...makeCaseQuestions("ventilation", "msp-ventilation", [
  [
    "support",
    "during",
    "En Daniel, si al aumentar la PEEP mejora la SpO₂ pero desciende la presión arterial, ¿qué mecanismo debes considerar?",
    [
      "Una reducción del retorno venoso relacionada con la presión intratorácica.",
      "Una pérdida de volumen circulante causada por el incremento del oxígeno.",
      "Una menor resistencia bronquial relacionada con la presión espiratoria.",
      "Una mayor demanda metabólica causada por el aumento de la oxigenación."
    ],
    0,
    "Una PEEP mayor puede reducir el retorno venoso. La mejoría de SpO₂ debe valorarse junto con presión, perfusión y examen, sin atribuir toda hipotensión al ventilador.",
    [
      "ventilator:settings",
      "action:circuit"
    ]
  ],
  [
    "sedation-review",
    "during",
    "Durante la sedación del paciente intubado aparecen hipotensión y menor respuesta. ¿Qué revisión tiene prioridad?",
    [
      "Aumentar la FiO₂ y comprobar después la relación entre sedación y perfusión.",
      "Repetir el sedante y comprobar después la adaptación al soporte ventilatorio.",
      "Revisar la exposición sedante y valorar de inmediato ventilación y perfusión.",
      "Aumentar la frecuencia y comprobar después la respuesta al soporte sedante."
    ],
    2,
    "La hipotensión tras sedación exige revisar fármacos, ventilación y perfusión con el equipo. Cambiar el ventilador sin valorar la causa puede añadir riesgo.",
    [
      "medication:sedative",
      "medication:midazolam",
      "medication:dexmedetomidine"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si propones una frecuencia de 16/min y un volumen corriente de 400 mL, ¿qué ventilación minuto estás proponiendo?",
    [
      "Una ventilación de 6,0 L/min, calculada con frecuencia y volumen corriente.",
      "Una ventilación de 6,4 L/min, calculada con frecuencia y volumen corriente.",
      "Una ventilación de 7,2 L/min, calculada con frecuencia y volumen corriente.",
      "Una ventilación de 8,0 L/min, calculada con frecuencia y volumen corriente."
    ],
    1,
    "16 × 400 mL = 6.400 mL/min = 6,4 L/min. Es ventilación minuto propuesta: no equivale al flujo de una cánula ni garantiza ventilación alveolar adecuada.",
    []
  ],
  [
    "closing-safety",
    "final",
    "En el relevo de Daniel, la SpO₂ mejora pero el EtCO₂ sigue elevado. ¿Qué interpretación debe guiar la reevaluación?",
    [
      "La oxigenación ha mejorado y permite confirmar la eliminación de CO₂.",
      "El EtCO₂ elevado demuestra que ha aumentado la concentración de oxígeno.",
      "La cifra de EtCO₂ permite reemplazar la valoración de una gasometría.",
      "La oxigenación ha mejorado y aún debe revisarse la eliminación de CO₂."
    ],
    3,
    "La oxigenación y la ventilación son dimensiones distintas. EtCO₂ no equivale a PaCO₂; se integran circuito, clínica y gasometría cuando está indicada.",
    []
  ]
]),
  ...makeCaseQuestions("stroke", "nice-stroke", [
  [
    "priority",
    "during",
    "Miguel presenta déficit focal desde hace unos 50 minutos. ¿Qué conjunto de datos orienta primero la ruta de atención?",
    [
      "Hora de hallazgo, presión arterial y evaluación del riesgo cardiovascular previo.",
      "Última vez visto bien, glucemia y evaluación urgente con neuroimagen.",
      "Hora de llegada, exploración motora y evaluación urgente del ritmo cardíaco.",
      "Inicio del lenguaje alterado, presión arterial y evaluación de la función renal."
    ],
    1,
    "La hora de inicio, la glucemia y la imagen ayudan a definir la ruta urgente. El tratamiento específico depende de la evaluación especializada, no de un cribado aislado.",
    [
      "action:onset",
      "action:help",
      "study:ct"
    ]
  ],
  [
    "oral-route",
    "during",
    "En el caso de Miguel se está considerando un comprimido oral y aún no se evaluó la deglución. ¿Qué corresponde hacer?",
    [
      "Administrarlo con agua y observar la aparición de cambios en la voz.",
      "Dividirlo en fragmentos y observar la presencia de tos al deglutir.",
      "Diferir la vía oral y solicitar el cribado de deglución por personal formado.",
      "Mezclarlo con alimento y observar la respuesta durante la primera toma."
    ],
    2,
    "Tras un ACV, la deglución debe evaluarse antes de alimentos, líquidos o medicación oral. Cambiar la presentación no demuestra que la vía sea segura.",
    [
      "action:swallow",
      "medication:aspirin",
      "medication:paracetamol"
    ]
  ],
  [
    "closing-priority",
    "final",
    "La TC simulada de Miguel no muestra hemorragia. ¿Qué conclusión está mejor sustentada por ese resultado?",
    [
      "La ausencia de hemorragia confirma una causa metabólica del déficit focal.",
      "La ausencia de hemorragia permite definir el alta tras valorar la presión.",
      "La ausencia de hemorragia confirma la recuperación del tejido cerebral.",
      "La ausencia de hemorragia requiere completar la evaluación de posible isquemia."
    ],
    3,
    "Una TC sin hemorragia visible no descarta isquemia precoz ni selecciona por sí sola una intervención. Debe continuar la ruta de ACV con el equipo.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Miguel ingresa con PA de 182/102 mmHg. Antes de un antihipertensivo, ¿qué información debe orientar la decisión?",
    [
      "Los objetivos del equipo de ACV, la imagen y el tratamiento que se contempla.",
      "La presión habitual del acompañante, el pulso y la duración del transporte.",
      "La disponibilidad de comprimidos, el pulso y la preferencia de presentación.",
      "El descenso obtenido con oxígeno, la temperatura y la tolerancia al alimento."
    ],
    0,
    "El manejo de presión en el ACV depende del contexto y del tratamiento previsto. En este escenario requiere imagen y objetivos revisados por el equipo.",
    []
  ]
]),
  ...makeCaseQuestions("asthma", "gina-asthma", [
  [
    "bronchodilator",
    "during",
    "En Andrés, si la saturación mejora con oxígeno pero continúa hablando en palabras sueltas, ¿qué interpretación es más adecuada?",
    [
      "La mejoría de SpO₂ indica menor resistencia bronquial, aunque persista la disnea.",
      "La mejoría de SpO₂ indica menor fatiga muscular, aunque persista la taquipnea.",
      "La mejoría de SpO₂ indica mayor oxigenación, aunque persista la obstrucción bronquial.",
      "La mejoría de SpO₂ indica menor retención de CO₂, aunque persista el esfuerzo."
    ],
    2,
    "Una mejor saturación no demuestra resolución del broncoespasmo. Habla, trabajo respiratorio y entrada de aire siguen siendo parte de la reevaluación.",
    [
      "medication:salbutamol",
      "medication:ipratropium",
      "medication:steroid",
      "action:oxygen"
    ]
  ],
  [
    "sedation",
    "during",
    "Andrés permanece agitado y con esfuerzo respiratorio. ¿Qué conjunto ayuda más a reconocer agotamiento ventilatorio antes de atribuirlo a ansiedad?",
    [
      "La entrada de aire, el trabajo respiratorio y la evolución del nivel de alerta.",
      "La intensidad de sibilancias, el pulso y la respuesta al alivio de la ansiedad.",
      "La saturación alcanzada, el flujo de oxígeno y la respuesta al apoyo verbal.",
      "La frecuencia respiratoria, la presión arterial y la duración de la agitación."
    ],
    0,
    "La agitación puede reflejar compromiso respiratorio. Un sedante puede deprimir la ventilación y ocultar deterioro; el paciente necesita reevaluación respiratoria.",
    [
      "medication:midazolam",
      "medication:sedative"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si en la evolución de Andrés disminuyen las sibilancias pero también la entrada de aire y el nivel de alerta, ¿qué debes sospechar?",
    [
      "Una respuesta broncodilatadora con recuperación del intercambio gaseoso.",
      "Una respuesta al oxígeno con descenso esperado del esfuerzo respiratorio.",
      "Una respuesta ansiosa con reducción transitoria del ruido respiratorio.",
      "Un deterioro ventilatorio con agotamiento y necesidad de ayuda avanzada."
    ],
    3,
    "La reducción de sibilancias con menor entrada de aire y alteración de conciencia puede indicar deterioro grave, no mejoría. Debe escalarse la atención.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Tras varias exposiciones a salbutamol, si aumenta mucho la frecuencia cardíaca, ¿qué conducta orienta mejor la revisión?",
    [
      "Cambiar la presentación y repetir la pauta antes de revisar el ritmo cardíaco.",
      "Revisar las exposiciones y reevaluar ritmo, potasio y respuesta respiratoria.",
      "Agregar un betabloqueante y revisar después el esfuerzo y el patrón respiratorio.",
      "Aumentar el flujo de oxígeno y repetir la pauta antes de revisar la acumulación."
    ],
    1,
    "La repetición de beta agonistas puede producir efectos cardiovasculares y metabólicos. Debe reevaluarse la necesidad y la exposición, sin tratar automáticamente la taquicardia compensatoria.",
    []
  ]
]),
  ...makeCaseQuestions("sepsis", "ssc-sepsis", [
  [
    "perfusion",
    "during",
    "En Carlos, si la presión mejora tras soporte pero persisten confusión y mala perfusión, ¿qué debe guiar la siguiente valoración?",
    [
      "La reducción de la fiebre y la tolerancia al esquema antipirético.",
      "La recuperación del pulso y la tolerancia a la primera ingesta.",
      "La normalización de la presión y la reducción del flujo de oxígeno.",
      "La tendencia de perfusión y la respuesta al tratamiento de la infección."
    ],
    3,
    "Una presión mejor no acredita recuperación global ni control de infección. Se integran perfusión, conciencia, tendencias y tratamiento causal.",
    [
      "action:fluids",
      "medication:norepinephrine",
      "medication:furosemide"
    ]
  ],
  [
    "antibiotic-timing",
    "during",
    "Se solicitaron hemocultivos de Carlos y el resultado tardará. Ante la sepsis descrita, ¿cómo se integra el tratamiento inicial?",
    [
      "Tomar muestras disponibles y comenzar el plan indicado sin esperar el cultivo.",
      "Obtener el cultivo definitivo y después elegir la primera pauta antimicrobiana.",
      "Repetir primero el hemograma y después decidir si hace falta tratar el foco.",
      "Corregir primero toda la hipotensión y después iniciar el tratamiento del foco."
    ],
    0,
    "Las muestras se obtienen sin demorar el tratamiento indicado. El resultado microbiológico posterior ayuda a revisar el plan, pero no debe retrasar la respuesta inicial.",
    [
      "medication:antibiotic",
      "study:cultures",
      "action:source"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si durante el aporte de líquidos Carlos presenta nuevos crepitantes y mayor esfuerzo respiratorio, ¿qué reevaluación corresponde?",
    [
      "La necesidad de ampliar el volumen antes de repetir el examen respiratorio.",
      "La necesidad de reducir el oxígeno antes de repetir el examen circulatorio.",
      "La respuesta al volumen y los signos de congestión junto con la perfusión.",
      "La respuesta al antitérmico y los signos de dolor junto con la temperatura."
    ],
    2,
    "El soporte con líquidos necesita reevaluación cardiopulmonar. La nueva dificultad respiratoria obliga a revisar volumen y perfusión, en lugar de asumir que más aporte siempre ayuda.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Si Carlos desarrolla presión y frecuencia elevadas durante la noradrenalina, ¿qué revisión es más pertinente?",
    [
      "Reforzar la perfusión vasoactiva y esperar el resultado microbiológico.",
      "Revisar el aporte vasoactivo y reevaluar presión, ritmo y perfusión tisular.",
      "Reemplazar el control del foco por el ajuste del tratamiento vasoactivo.",
      "Ampliar el volumen de cristaloides y posponer la revisión de la perfusión."
    ],
    1,
    "Los cambios pueden relacionarse con el soporte vasoactivo. Hay que revisar el aporte con el equipo y valorar la perfusión, manteniendo el tratamiento de la infección.",
    []
  ]
]),
  ...makeCaseQuestions("anaphylaxis", "rcuk-anaphylaxis", [
  [
    "first-line",
    "during",
    "Javier presenta ronquera, sibilancias e hipotensión tras ingerir un alimento. ¿Qué plan farmacológico tiene prioridad en este contexto?",
    [
      "Iniciar un antihistamínico y valorar después la necesidad de adrenalina.",
      "Priorizar adrenalina intramuscular y coordinar el soporte respiratorio y circulatorio.",
      "Iniciar un corticoide y valorar después la respuesta del edema y la presión.",
      "Priorizar broncodilatación inhalada y valorar después la respuesta circulatoria."
    ],
    1,
    "La afectación de vía aérea, respiración y circulación indica una amenaza sistémica. La adrenalina IM tiene prioridad; los coadyuvantes no sustituyen su papel.",
    [
      "medication:adrenaline",
      "medication:antihistamine",
      "medication:hydrocortisone",
      "action:trigger"
    ]
  ],
  [
    "airway-recheck",
    "during",
    "Si la urticaria de Javier disminuye pero persisten ronquera e hipotensión, ¿qué interpretación orienta la reevaluación?",
    [
      "La respuesta cutánea permite pasar a vigilancia centrada en los síntomas de piel.",
      "La respuesta cutánea permite diferir el soporte hasta comprobar la temperatura.",
      "La respuesta cutánea sugiere cambiar el rescate por un tratamiento antihistamínico.",
      "La respuesta cutánea convive con compromiso de vía aérea y circulación persistente."
    ],
    3,
    "La mejoría de la piel no demuestra resolución de las amenazas respiratoria y circulatoria. Debe mantenerse la reevaluación ABC y el tratamiento indicado.",
    [
      "action:oxygen",
      "action:fluids"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Después de la mejoría inicial de Javier, ¿qué plan de continuidad se justifica por la reacción que presentó?",
    [
      "Observación y reevaluación según gravedad y riesgo de recurrencia del cuadro.",
      "Reevaluación ambulatoria tras comprobar que disminuyó la erupción cutánea.",
      "Reposición de líquidos hasta que desaparezca por completo el prurito cutáneo.",
      "Vigilancia centrada en la piel hasta conocer el resultado sérico de triptasa."
    ],
    0,
    "La mejoría inicial no elimina la necesidad de observación y reevaluación. La continuidad se individualiza según evolución, gravedad y riesgo de recurrencia.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Al preparar el tratamiento inicial de la anafilaxia de Javier, ¿qué verificación evita un error relevante de administración?",
    [
      "Confirmar el nombre y usar la presentación disponible por vía intravenosa directa.",
      "Confirmar el nombre y repetir la presentación previa sin revisar la concentración.",
      "Confirmar indicación, concentración, cantidad y vía intramuscular del rescate.",
      "Confirmar el nombre y usar la presentación disponible por vía subcutánea lenta."
    ],
    2,
    "La vía y la concentración son parte de la seguridad. La adrenalina intravenosa exige otro contexto y personal experto; no equivale al rescate IM inicial del caso.",
    []
  ]
]),
  ...makeCaseQuestions("hypoglycemia", "msp-diabetes", [
  [
    "route",
    "during",
    "Luis tiene glucemia de 38 mg/dL y Glasgow 11. ¿Qué elección es más compatible con su estado al ingreso?",
    [
      "Corregir por vía parenteral y vigilar la vía aérea con glucemias seriadas.",
      "Corregir con solución oral y vigilar la respuesta durante la primera toma.",
      "Corregir con alimento triturado y vigilar la respuesta al aporte de azúcar.",
      "Corregir con gel por boca y vigilar la tolerancia antes de medir de nuevo."
    ],
    0,
    "La conciencia alterada impide asumir una deglución segura. Se necesita corrección por una vía adecuada y reevaluación de glucemia, conciencia y vía aérea.",
    [
      "medication:dextrose",
      "medication:glucagon",
      "medication:oral-glucose",
      "medication:insulin",
      "action:airway"
    ]
  ],
  [
    "sample-timing",
    "during",
    "Después de administrar tratamiento a Luis, ¿qué información permite evaluar la respuesta metabólica actual?",
    [
      "La glucemia de ingreso y la temperatura registrada antes de administrar.",
      "La cantidad preparada y la frecuencia cardíaca registrada antes de administrar.",
      "Una nueva glucemia y la conciencia evaluadas después de la administración.",
      "La glucemia de ingreso y la presión arterial evaluada después de administrar."
    ],
    2,
    "La muestra inicial corresponde a un momento previo. Una nueva glucemia, junto con conciencia y evolución, permite reevaluar la respuesta.",
    [
      "study:glucose",
      "action:review"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si Luis recupera la conciencia tras corregir la glucemia, ¿qué aspecto del antecedente sigue condicionando la observación?",
    [
      "El pulso inicial y la sudoración previa, aunque la glucemia se haya corregido.",
      "El uso de insulina sin ingesta y el riesgo de nueva caída de la glucemia.",
      "La presión inicial y el acceso venoso, aunque la conciencia se haya recuperado.",
      "El tiempo de la muestra y el flujo elegido, aunque la glucemia se haya corregido."
    ],
    1,
    "La insulina y la ingesta omitida explican riesgo de recurrencia. Deben revisarse la causa, el plan de alimentación y la vigilancia con el equipo.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Antes de pasar a aporte oral tras la recuperación de Luis, ¿qué hallazgo sustenta mejor esa vía?",
    [
      "Una glucemia corregida junto con persistencia de somnolencia al hablar.",
      "Una presión conservada junto con ausencia de vómitos durante el rescate.",
      "Una frecuencia normal junto con tolerancia previa a los alimentos sólidos.",
      "Una conciencia recuperada junto con valoración favorable de la deglución."
    ],
    3,
    "La corrección de una cifra no garantiza seguridad oral. Deben reevaluarse alerta y deglución y mantener vigilancia de recurrencia.",
    []
  ]
]),
  ...makeCaseQuestions("obstetric", "msp-obstetric", [
  [
    "perfusion",
    "during",
    "Lucía ingresa con FC 122/min, PA sistólica 88 mmHg y 900 mL de pérdida descrita. ¿Cómo interpretas su índice de choque?",
    [
      "Es cercano a 0,72 y debe relacionarse con la pérdida y el estado circulatorio.",
      "Es cercano a 1,39 y debe relacionarse con la pérdida y el estado circulatorio.",
      "Es cercano a 1,02 y debe relacionarse con la pérdida y el estado circulatorio.",
      "Es cercano a 0,95 y debe relacionarse con la pérdida y el estado circulatorio."
    ],
    1,
    "El índice se calcula FC/PA sistólica: 122/88 ≈ 1,39. En este caso acompaña datos de hipoperfusión y sangrado; no sustituye la valoración clínica.",
    [
      "action:help",
      "action:fluids",
      "action:massage"
    ]
  ],
  [
    "tann-sequence",
    "during",
    "Si durante la colocación del TANN de Lucía ya cerraste tobillos, pantorrillas y muslos, ¿qué componente corresponde a continuación?",
    [
      "El componente abdominal, antes de ajustar el componente pélvico.",
      "El componente de fijación, antes de ajustar el componente pélvico.",
      "El componente pélvico, antes de ajustar los componentes abdominales.",
      "El componente de la esfera, antes de ajustar los componentes abdominales."
    ],
    2,
    "La secuencia del dispositivo avanza desde las piernas hacia pelvis y abdomen. Los cierres y la tolerancia requieren comprobación; el traje sigue siendo apoyo temporal.",
    [
      "garment:pelvis",
      "action:uterotonic"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si la presión de Lucía mejora con soporte y TANN pero persiste la pérdida vaginal, ¿qué prioridad sigue pendiente?",
    [
      "Completar la vigilancia del tono y mantener el mismo soporte hasta el relevo.",
      "Completar la reposición de volumen y diferir la revisión de la fuente hemorrágica.",
      "Completar el cierre del traje y sustituir con ello el tratamiento del tono uterino.",
      "Continuar la respuesta a la causa y coordinar el control del sangrado persistente."
    ],
    3,
    "El soporte circulatorio y el TANN no controlan por sí mismos la fuente. El sangrado persistente obliga a continuar la respuesta obstétrica y el escalamiento.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Lucía aún presenta hipotensión y sangrado al terminar la práctica. ¿Qué plan respecto al TANN corresponde al escenario?",
    [
      "Mantener el soporte y coordinar control definitivo con reevaluación continua.",
      "Iniciar retiro desde el abdomen y comprobar después la tolerancia circulatoria.",
      "Aflojar las piernas y comprobar después la respuesta del pulso y la presión.",
      "Retirar la fijación y comprobar después la respuesta de la respiración y el tono."
    ],
    0,
    "La paciente sigue inestable. El retiro requiere condiciones de estabilidad y supervisión que no están presentes; el traje acompaña la atención definitiva.",
    []
  ]
]),
  ...makeCaseQuestions("gyn-01", "msp-maternal", [
  [
    "bleeding",
    "during",
    "Lucía presenta manchado vaginal escaso, dolor unilateral y presíncope. ¿Qué interpretación integra mejor esos hallazgos?",
    [
      "La cantidad visible orienta una pérdida leve que permite posponer la perfusión.",
      "El dolor unilateral orienta una causa anexial que permite diferir la estabilización.",
      "La pérdida visible puede subestimar una hemorragia interna con compromiso circulatorio.",
      "El manchado escaso orienta una causa local que permite diferir la evaluación de embarazo."
    ],
    2,
    "La cantidad vaginal visible no refleja necesariamente la pérdida interna. El dolor, presíncope y perfusión requieren evaluación urgente y estabilización.",
    [
      "action:fluids",
      "action:definitive",
      "action:pregnancy",
      "action:med-methotrexate"
    ]
  ],
  [
    "pregnancy-location",
    "during",
    "Si la prueba de embarazo es positiva y la paciente sigue inestable, ¿qué plan tiene prioridad?",
    [
      "Organizar soporte y valoración ginecológica urgente sin esperar una serie de β-hCG.",
      "Organizar una nueva β-hCG diferida para localizar la gestación antes del soporte.",
      "Organizar analgesia y reevaluación ambulatoria para comprobar la evolución del dolor.",
      "Organizar tratamiento médico específico antes de valorar estabilidad y localización."
    ],
    0,
    "La inestabilidad obliga a estabilizar y coordinar atención resolutiva. Una cifra de β-hCG no localiza la gestación ni justifica demorar atención urgente.",
    [
      "action:ultrasound",
      "action:blood"
    ]
  ],
  [
    "closing-priority",
    "final",
    "En el resultado simulado se informa masa anexial y líquido libre, sin gestación intrauterina identificada. ¿Cómo integras ese informe?",
    [
      "Como confirmación de aborto completo que permite programar seguimiento diferido.",
      "Como hallazgos preocupantes que deben integrarse con perfusión y valoración urgente.",
      "Como confirmación de gestación viable que permite programar seguimiento ecográfico.",
      "Como hallazgos inespecíficos que permiten esperar una nueva muestra sin estabilizar."
    ],
    1,
    "En esta paciente inestable, la masa y el líquido libre son preocupantes. La conducta requiere integrar imagen y estado clínico con el equipo; no depende de una cifra aislada.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Antes de una exploración íntima de esta paciente consciente, ¿qué acción mantiene una atención adecuada al contexto?",
    [
      "Completar el examen pélvico y explicar después los hallazgos que motivaron la urgencia.",
      "Obtener la autorización del acompañante y continuar después con la exploración pélvica.",
      "Diferir toda evaluación hasta disponer del resultado definitivo de la muestra hormonal.",
      "Explicar y solicitar consentimiento, ofreciendo acompañamiento clínico durante el examen."
    ],
    3,
    "El consentimiento es específico y continuo. Debe explicarse la necesidad de la exploración, preservando intimidad y acompañamiento, sin demorar la estabilización necesaria.",
    []
  ]
]),
  ...makeCaseQuestions("gyn-02", "cdc-pid", [
  [
    "infection",
    "during",
    "Valeria presenta dolor pélvico, fiebre de 38,8 °C y vómitos. ¿Qué plan se ajusta mejor a la gravedad y tolerancia oral descritas?",
    [
      "Coordinar valoración hospitalaria y tratamiento individualizado con soporte inicial.",
      "Coordinar tratamiento oral ambulatorio y revisar la tolerancia en el siguiente control.",
      "Coordinar analgesia ambulatoria y revisar el tratamiento cuando llegue el cultivo.",
      "Coordinar una prueba diferida y revisar la fiebre después de recuperar la ingesta."
    ],
    0,
    "La enfermedad grave y la intolerancia oral justifican valorar ingreso y tratamiento parenteral individualizado. El esquema depende de la evaluación y del protocolo institucional.",
    [
      "action:antibiotics",
      "action:admit",
      "action:med-antibiotic-plan",
      "action:med-paracetamol"
    ]
  ],
  [
    "differential",
    "during",
    "Con dolor pélvico y fiebre en una mujer con posibilidad de embarazo, ¿qué evaluación evita cerrar prematuramente el diagnóstico?",
    [
      "Valorar el flujo y atribuir el dolor a infección antes de estudiar otras causas.",
      "Valorar la fiebre y atribuir el vómito a infección antes de estudiar embarazo.",
      "Valorar el dolor y elegir un antibiótico antes de completar la evaluación inicial.",
      "Valorar embarazo y causas de abdomen agudo junto con la sospecha infecciosa."
    ],
    3,
    "La sospecha de infección no elimina embarazo ectópico u otras causas de dolor pélvico. La evaluación dirigida y la estabilización deben continuar en paralelo.",
    [
      "action:pregnancy",
      "action:ultrasound",
      "action:samples"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si el dolor disminuye tras un analgésico pero persisten fiebre y vómitos, ¿cómo debes interpretar la respuesta?",
    [
      "Como respuesta causal que permite convertir el plan a seguimiento ambulatorio.",
      "Como respuesta al tratamiento que permite retirar la evaluación de embarazo.",
      "Como alivio sintomático que aún exige revisar infección y tolerancia al tratamiento.",
      "Como recuperación funcional que permite diferir el tratamiento hasta el cultivo."
    ],
    2,
    "La analgesia puede aliviar síntomas sin tratar la infección. La fiebre y los vómitos mantienen la necesidad de revisar gravedad, vía y plan de atención.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Las muestras de Valeria siguen pendientes al coordinar el ingreso. ¿Qué información es más útil para el relevo?",
    [
      "El dolor actual, la presentación analgésica y la fecha prevista del siguiente cultivo.",
      "La gravedad clínica, la tolerancia oral, las muestras y el tratamiento administrado.",
      "El flujo observado, el número de pruebas y la presentación preferida del antibiótico.",
      "La temperatura inicial, la preferencia de ingesta y el número de familiares presentes."
    ],
    1,
    "El relevo debe permitir continuar la estabilización y revisar el plan terapéutico cuando haya resultados. Incluye gravedad, tolerancia, acciones y muestras pendientes.",
    []
  ]
]),
  ...makeCaseQuestions("obs-01", "msp-obstetric", [
  [
    "uterotonic",
    "during",
    "Camila presenta hemorragia tras el parto y útero blando. ¿Qué interpretación orienta el manejo de la causa?",
    [
      "El tono conservado orienta lesión del canal y exige priorizar su reparación.",
      "La hipotonía orienta atonía y exige valorar también otras fuentes de sangrado.",
      "La pérdida inicial orienta coagulopatía y exige priorizar corrección de factores.",
      "El alumbramiento reciente orienta tejido retenido y exige priorizar su extracción."
    ],
    1,
    "La hipotonía sugiere atonía, pero no excluye otras causas. La respuesta integra las 4 T, soporte, tratamiento indicado y reevaluación del sangrado.",
    [
      "action:uterotonic",
      "action:med-oxytocin",
      "action:med-misoprostol",
      "action:txa"
    ]
  ],
  [
    "tann-check",
    "during",
    "Cuando se hayan cerrado los seis componentes del TANN de Camila, ¿qué acción completa la colocación?",
    [
      "Comprobar cierres, esfera y tolerancia respiratoria, y reevaluar la perfusión.",
      "Comprobar el número de componentes y diferir la tolerancia hasta el traslado.",
      "Comprobar la presión arterial y aflojar el abdomen antes de revisar la tolerancia.",
      "Comprobar la fijación distal y diferir la revisión de la esfera hasta el relevo."
    ],
    0,
    "El cierre de componentes necesita verificación de posición, fijación y tolerancia. El traje se mantiene como apoyo junto con reanimación y control de la causa.",
    [
      "action:tann"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si persiste la hemorragia de Camila pese al masaje y tratamiento uterotónico, ¿qué paso responde mejor a esa evolución?",
    [
      "Repetir el mismo soporte y esperar a que la pérdida acumulada disminuya.",
      "Completar el TANN y considerar resuelto el foco si mejora la presión.",
      "Ampliar los estudios y diferir la valoración de la causa hasta el resultado.",
      "Revisar las causas hemorrágicas y escalar el control con el equipo obstétrico."
    ],
    3,
    "La persistencia de sangrado exige reevaluar las 4 T y coordinar control avanzado. La mejoría circulatoria no acredita hemostasia ni borra la pérdida acumulada.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Al entregar el caso de Camila, ¿qué conjunto permite valorar mejor la evolución de la hemorragia?",
    [
      "La presión más reciente y la presentación del último fármaco administrado.",
      "La temperatura inicial y el número de componentes del traje disponibles.",
      "La pérdida acumulada, el sangrado actual, la perfusión y la respuesta al plan.",
      "La saturación más reciente y el número de pruebas solicitadas durante el caso."
    ],
    2,
    "La pérdida previa y el sangrado actual son datos distintos. El relevo integra ambos con perfusión, acciones y respuesta para sostener la continuidad de atención.",
    []
  ]
]),
  ...makeCaseQuestions("obs-02", "msp-obstetric", [
  [
    "magnesium",
    "during",
    "En la gestante con PA 172/112 mmHg, cefalea y visión borrosa, ¿qué diferencia funcional debe guiar la preparación del tratamiento?",
    [
      "El magnesio reduce la presión y el antihipertensivo previene las convulsiones.",
      "El magnesio mejora el tono y el antihipertensivo corrige la perfusión placentaria.",
      "El magnesio aborda el riesgo convulsivo y el antihipertensivo controla la presión.",
      "El magnesio corrige la diuresis y el antihipertensivo trata el dolor epigástrico."
    ],
    2,
    "La prevención o tratamiento de convulsiones y el control de hipertensión cumplen funciones diferentes. Ambos requieren indicación y vigilancia materna.",
    [
      "action:magnesium",
      "action:med-magnesium",
      "action:med-labetalol",
      "action:med-hydralazine"
    ]
  ],
  [
    "severe-features",
    "during",
    "La paciente sigue con cefalea y dolor epigástrico aunque una nueva presión sea menor. ¿Qué interpretación es más adecuada?",
    [
      "La cifra menor permite atribuir el dolor a un problema digestivo ambulatorio.",
      "La cifra menor permite retirar la vigilancia de síntomas neurológicos maternos.",
      "La cifra menor permite priorizar el alta si la saturación permanece conservada.",
      "La cifra menor debe integrarse con síntomas persistentes y riesgo de complicación."
    ],
    3,
    "Una mejor medición aislada no elimina síntomas de alarma. Deben continuar la evaluación materna, el control de riesgos y la coordinación obstétrica.",
    [
      "action:antihypertensive",
      "action:fetal"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Tras una mejoría inicial de la gestante, ¿qué plan de continuidad sigue siendo coherente con este caso?",
    [
      "Vigilancia materna y fetal y planificación obstétrica según la evolución.",
      "Seguimiento ambulatorio y control de presión al resolver la cefalea inicial.",
      "Observación del dolor y planificación del alta según la tolerancia oral.",
      "Seguimiento del pulso y control fetal después de retirar la vigilancia materna."
    ],
    0,
    "La urgencia hipertensiva requiere vigilancia y un plan obstétrico resolutivo. La mejoría de una variable no completa por sí misma la atención.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Durante el uso de magnesio, si aparecen menor frecuencia respiratoria y pérdida de reflejos, ¿qué revisión debe priorizarse?",
    [
      "La necesidad de otra pauta de magnesio para reforzar el control convulsivo.",
      "La posibilidad de toxicidad, el aporte administrado y la valoración urgente.",
      "La necesidad de aumentar el antihipertensivo para mejorar la respuesta renal.",
      "La posibilidad de ansiedad, el patrón de sueño y la tolerancia al alimento."
    ],
    1,
    "La depresión respiratoria y alteración de reflejos requieren revisión urgente de posible toxicidad y del tratamiento con el equipo. La vigilancia incluye diuresis y función renal.",
    []
  ]
]),
  ...makeCaseQuestions("obs-03", "msp-obstetric", [
  [
    "antibiotic",
    "during",
    "La paciente puerperal presenta fiebre, hipotensión y confusión con probable foco uterino. ¿Qué conjunto orienta el plan antimicrobiano?",
    [
      "La presentación disponible, la preferencia de vía y el control de la fiebre.",
      "La tolerancia al alimento, la reducción del dolor y el control del pulso.",
      "La cantidad de loquios, la preferencia de horario y el control del sueño.",
      "El foco probable, las alergias, la gravedad y la necesidad de control causal."
    ],
    3,
    "El plan de sepsis materna integra foco, antecedentes y gravedad. La selección farmacológica se coordina con el equipo y no sustituye el control del foco.",
    [
      "action:antibiotics",
      "action:med-ceftriaxone-metronidazole",
      "action:med-ampicillin-clindamycin",
      "action:definitive"
    ]
  ],
  [
    "culture-timing",
    "during",
    "Se están tomando cultivos en esta paciente con deterioro puerperal. ¿Qué organización evita demorar la respuesta inicial?",
    [
      "Tomar muestras disponibles y coordinar soporte y tratamiento sin esperar el resultado.",
      "Completar la identificación del germen y coordinar después el primer tratamiento.",
      "Obtener primero todas las imágenes y coordinar después la respuesta circulatoria.",
      "Corregir primero toda la fiebre y coordinar después la atención del foco infeccioso."
    ],
    0,
    "La toma de muestras y el tratamiento se coordinan sin retrasar estabilización ni antimicrobianos indicados. La microbiología permite ajustar después el plan.",
    [
      "action:cultures",
      "action:iv"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si la presión de la paciente mejora pero persiste la sospecha de infección uterina, ¿qué prioridad conserva vigencia?",
    [
      "Completar el aporte de líquidos antes de volver a revisar el foco infeccioso.",
      "Usar la mejoría de la presión para convertir el tratamiento a control ambulatorio.",
      "Mantener la evaluación del foco y el tratamiento junto con la reevaluación orgánica.",
      "Usar la reducción del pulso para diferir el control del foco hasta el siguiente turno."
    ],
    2,
    "El soporte circulatorio no elimina la infección. Debe continuar la evaluación y control del foco, con vigilancia de la respuesta y disfunción orgánica.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Esta paciente está después del parto. ¿Qué información orienta de forma más directa la vigilancia durante el traslado?",
    [
      "La temperatura, el dolor uterino, los cultivos y la respuesta al antitérmico.",
      "La perfusión, el foco uterino, los tratamientos y la respuesta clínica materna.",
      "La saturación, la dosis antimicrobiana, las imágenes y la tolerancia a líquidos.",
      "La frecuencia, la analítica inicial, la vía venosa y la duración del transporte."
    ],
    1,
    "En el puerperio la continuidad se centra en el estado materno y el foco infeccioso. Deben comunicarse deterioro, acciones, respuesta y pendientes.",
    []
  ]
]),
  ...additionalObstetricQuestions(),
 ];
}
