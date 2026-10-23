import { makeCaseQuestions } from "./caseQuestionAuthoring";
import type { CaseQuestion } from "./clinicalEducation";

export function additionalObstetricQuestions(): CaseQuestion[] {
 return [
  ...makeCaseQuestions("obs-04", "msp-obstetric", [
  [
    "clinical-decision",
    "during",
    "Sofía continúa sangrando después de un parto instrumental, con útero firme y placenta descrita completa. ¿Qué hipótesis gana prioridad?",
    [
      "Una alteración primaria del tono que requiere insistir en masaje uterino.",
      "Una retención de tejido que requiere repetir la revisión de la placenta.",
      "Una lesión del canal del parto que requiere revisión y control del sangrado.",
      "Una alteración de coagulación que requiere ampliar el perfil de laboratorio."
    ],
    2,
    "El útero firme y el antecedente instrumental hacen prioritaria la búsqueda de trauma. La revisión de las demás causas continúa; el diagnóstico no se resuelve por un único hallazgo.",
    [
      "action:quantify",
      "action:massage",
      "action:uterotonic",
      "action:med-oxytocin"
    ]
  ],
  [
    "source-control",
    "during",
    "En Sofía se sospecha una lesión cervical o vaginal y la perfusión está comprometida. ¿Qué coordinación aborda mejor la causa?",
    [
      "Mantener el masaje y reevaluar la reparación después de normalizar la presión.",
      "Coordinar revisión y reparación por personal capacitado con soporte simultáneo.",
      "Mantener el uterotónico y reevaluar la reparación después de completar el efecto.",
      "Coordinar el TANN y reevaluar la reparación después de conseguir todos los análisis."
    ],
    1,
    "El trauma requiere evaluación y reparación por el equipo capacitado. Soporte, sangre y medidas temporales se coordinan sin sustituir ese control.",
    [
      "action:definitive",
      "action:blood"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si la presión de Sofía mejora después del soporte y aún hay sangrado, ¿qué conclusión está sustentada?",
    [
      "La respuesta circulatoria acredita hemostasia y permite reducir la vigilancia.",
      "La respuesta circulatoria orienta atonía y permite mantener el mismo enfoque.",
      "La respuesta circulatoria descarta coagulopatía y permite diferir los estudios.",
      "La respuesta circulatoria es parcial y aún debe comprobarse el control de la lesión."
    ],
    3,
    "La mejoría de perfusión no acredita reparación ni hemostasia. Debe reevaluarse la pérdida activa y el control de la lesión.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Sofía tiene sangrado activo y un resultado inicial de coagulación sin alteración importante. ¿Cómo integras ese resultado?",
    [
      "El resultado reduce la sospecha de coagulopatía sin excluir una fuente traumática.",
      "El resultado reduce la sospecha de trauma y permite priorizar vigilancia del tono.",
      "El resultado confirma hemostasia local y permite posponer la revisión de la lesión.",
      "El resultado confirma atonía uterina y permite repetir el tratamiento uterotónico."
    ],
    0,
    "La coagulación inicial no demuestra hemostasia ni excluye una lesión. El resultado debe integrarse con sangrado, perfusión y evaluación del canal del parto.",
    []
  ]
]),
  ...makeCaseQuestions("obs-05", "msp-obstetric", [
  [
    "clinical-decision",
    "during",
    "En Mariana falta un cotiledón placentario, el útero está blando y persiste la hemorragia. ¿Qué relación causal debes considerar?",
    [
      "El tejido retenido puede mantener el sangrado y coexistir con hipotonía uterina.",
      "El tejido faltante señala trauma del canal y reemplaza la evaluación del tono.",
      "La hipotonía confirma una causa aislada y reduce la relevancia del tejido faltante.",
      "La placenta incompleta confirma coagulopatía y reemplaza la evaluación del canal."
    ],
    0,
    "La sospecha de tejido retenido debe integrarse con la hipotonía y el sangrado. Recuperar tono no demuestra que se haya eliminado el tejido.",
    [
      "action:placental-review",
      "action:quantify",
      "action:med-oxytocin",
      "action:uterotonic"
    ]
  ],
  [
    "uterine-response",
    "during",
    "Si Mariana mejora parcialmente el tono después del tratamiento pero continúa la pérdida, ¿qué coordinación conserva prioridad?",
    [
      "Repetir el tratamiento del tono y diferir el control del tejido hasta el relevo.",
      "Ampliar el aporte de líquidos y diferir el control del tejido hasta la estabilidad.",
      "Coordinar el control del tejido retenido con reanimación y vigilancia simultáneas.",
      "Completar el traje antichoque y diferir el control del tejido hasta nuevos análisis."
    ],
    2,
    "El control del tejido corresponde al equipo entrenado, en un entorno preparado. El soporte y tratamiento del tono acompañan, pero no sustituyen esa intervención.",
    [
      "action:definitive",
      "action:blood"
    ]
  ],
  [
    "closing-priority",
    "final",
    "¿Qué dato del caso de Mariana debe mantenerse explícito en el relevo para orientar el control de la causa?",
    [
      "La placenta informada completa, la pérdida actual y la respuesta al tratamiento.",
      "La integridad placentaria incierta, la pérdida actual y la respuesta al tratamiento.",
      "La sospecha de atonía aislada, la pérdida actual y la respuesta al tratamiento.",
      "La sospecha de tejido faltante, la pérdida actual y la respuesta al tratamiento."
    ],
    3,
    "Se ha descrito un cotiledón faltante. El relevo debe conservar ese hallazgo concreto, junto con pérdida, perfusión y respuesta, sin convertirlo en una descripción genérica.",
    []
  ],
  [
    "closing-safety",
    "final",
    "En Mariana se plantea resolver el tejido retenido. ¿Qué organización del procedimiento es más adecuada?",
    [
      "Programar la revisión después de completar el volumen previsto para la reposición.",
      "Coordinar personal capacitado y recursos para controlar la hemorragia y reevaluar.",
      "Programar la revisión después de comprobar la normalización del hemograma inicial.",
      "Coordinar la extracción por el estudiante después de comprobar el cierre del traje."
    ],
    1,
    "El control de tejido retenido requiere personal capacitado y recursos para atender la hemorragia. La coordinación debe acompañar la estabilización y preservar los límites del rol.",
    []
  ]
]),
  ...makeCaseQuestions("obs-06", "msp-obstetric", [
  [
    "clinical-decision",
    "during",
    "Paula está somnolienta tras una convulsión, con PA 178/116 mmHg y SpO₂ 91 %. ¿Qué respuesta inicial integra mejor el riesgo actual?",
    [
      "Controlar la presión y organizar después la valoración de respiración y conciencia.",
      "Controlar el dolor y organizar después la vigilancia del siguiente episodio convulsivo.",
      "Controlar la convulsión previa y organizar después la valoración de la presión.",
      "Proteger vía aérea y coordinar tratamiento convulsivo y de hipertensión con vigilancia."
    ],
    3,
    "La respuesta requiere estabilización ABC, prevención de lesiones y tratamiento de convulsiones e hipertensión. La ausencia de una nueva crisis no elimina el riesgo.",
    [
      "action:seizure-safety",
      "action:magnesium",
      "action:med-magnesium"
    ]
  ],
  [
    "oral-route",
    "during",
    "Se considera una presentación oral en Paula mientras sigue en período posictal. ¿Qué dato condiciona más directamente la elección de vía?",
    [
      "La somnolencia y el riesgo de deglución no segura después de la convulsión.",
      "La presión elevada y la disponibilidad de una presentación oral de acción rápida.",
      "La cefalea previa y la tolerancia habitual a comprimidos antes de la convulsión.",
      "La edad gestacional y la disponibilidad de una presentación de menor tamaño."
    ],
    0,
    "La somnolencia posictal impide asumir deglución segura. Debe elegirse una vía compatible con el estado actual bajo indicación del equipo.",
    [
      "action:med-nifedipine",
      "action:med-labetalol"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Paula no ha vuelto a convulsionar tras la respuesta inicial. ¿Qué conjunto mantiene relevancia para su vigilancia?",
    [
      "Dolor, tolerancia oral y frecuencia de las contracciones durante la observación.",
      "Sueño, temperatura y aceptación del alimento durante la recuperación posictal.",
      "Respiración, reflejos, diuresis, presión y evolución de la conciencia materna.",
      "Pulso, tolerancia al alimento y percepción del dolor durante la recuperación."
    ],
    2,
    "La vigilancia materna continúa tras la crisis e incluye seguridad del tratamiento. Deben observarse respiración, reflejos, diuresis, presión y conciencia.",
    []
  ],
  [
    "closing-safety",
    "final",
    "En Paula se solicita evaluación fetal mientras persiste compromiso respiratorio materno. ¿Cómo debe organizarse la atención?",
    [
      "Completar primero el registro fetal y después revisar la estabilización materna.",
      "Coordinar evaluación fetal en paralelo sin retrasar la estabilización materna.",
      "Completar primero la imagen obstétrica y después revisar la vía aérea materna.",
      "Coordinar evaluación fetal después de retirar el tratamiento anticonvulsivante."
    ],
    1,
    "La valoración fetal se coordina con la respuesta obstétrica, sin posponer la estabilización materna. Las decisiones resolutivas requieren evaluación del equipo.",
    []
  ]
]),
  ...makeCaseQuestions("obs-07", "msp-obstetric", [
  [
    "clinical-decision",
    "during",
    "La paciente consulta cinco días después del parto con cefalea y presión grave. ¿Cómo influye el puerperio en la interpretación?",
    [
      "Orienta una causa tensional y permite diferir la evaluación de complicaciones.",
      "Mantiene la posibilidad de una urgencia hipertensiva con complicaciones maternas.",
      "Orienta una causa de deshidratación y permite priorizar la reposición de volumen.",
      "Mantiene la sospecha de dolor puerperal y permite iniciar control sintomático."
    ],
    1,
    "Los trastornos hipertensivos pueden aparecer o persistir en el puerperio. El parto previo no elimina el riesgo de complicaciones maternas.",
    [
      "action:neurologic",
      "action:magnesium",
      "action:med-magnesium"
    ]
  ],
  [
    "treatment-roles",
    "during",
    "En esta puérpera se coordinan magnesio y antihipertensivo. ¿Qué distinción es relevante para evaluar la respuesta?",
    [
      "La mejoría del dolor confirma tanto el efecto anticonvulsivo como el antihipertensivo.",
      "La reducción del pulso confirma tanto el control neurológico como el antihipertensivo.",
      "La ausencia de convulsiones permite atribuir al magnesio el control de la presión.",
      "El control de la presión y la prevención convulsiva necesitan valoraciones diferentes."
    ],
    3,
    "Los tratamientos cumplen objetivos distintos. Una respuesta parcial no reemplaza la vigilancia neurológica, circulatoria y de seguridad del magnesio.",
    [
      "action:antihypertensive",
      "action:med-labetalol"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Tras una mejoría inicial, ¿qué plan de continuidad corresponde a esta paciente que ya terminó la gestación?",
    [
      "Vigilancia materna y plan especializado de control de presión y riesgo neurológico.",
      "Vigilancia del dolor y control ambulatorio basado en una presión menor al ingreso.",
      "Vigilancia de la ingesta y revisión ambulatoria según la tolerancia al analgésico.",
      "Vigilancia del sueño y revisión de presión después de retirar el tratamiento inicial."
    ],
    0,
    "La atención se centra en la madre y el riesgo puerperal. Requiere vigilancia y un plan especializado según evolución, sin trasladar acciones fetales de un embarazo vigente.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Si la cefalea de esta puérpera disminuye pero la presión sigue en rango grave, ¿qué conclusión orienta la atención?",
    [
      "La mejoría del dolor permite convertir el control de presión a seguimiento diferido.",
      "La mejoría del dolor permite interpretar la presión como respuesta emocional inicial.",
      "La mejoría del dolor no demuestra control del riesgo hipertensivo y neurológico.",
      "La mejoría del dolor permite posponer la revisión del tratamiento hasta el relevo."
    ],
    2,
    "La respuesta de un síntoma no acredita control de la hipertensión. Debe continuar la revisión de presión y riesgo neurológico con el equipo.",
    []
  ]
]),
  ...makeCaseQuestions("obs-08", "msp-obstetric", [
  [
    "clinical-decision",
    "during",
    "La gestante presenta probable foco urinario, hipotensión y disfunción orgánica. ¿Qué plan inicial se ajusta a ese conjunto?",
    [
      "Iniciar tratamiento oral y decidir ingreso según la respuesta de la disuria.",
      "Esperar la imagen renal y decidir soporte según la localización de la infección.",
      "Obtener muestras sin demorar soporte y tratamiento indicado de sepsis materna.",
      "Esperar el cultivo definitivo y decidir tratamiento según la sensibilidad del germen."
    ],
    2,
    "El compromiso orgánico y la hipotensión requieren respuesta hospitalaria de sepsis materna. Se toman muestras sin demorar estabilización ni tratamiento indicado.",
    [
      "action:urine",
      "action:antibiotics",
      "action:med-ceftriaxone-metronidazole",
      "action:med-ampicillin-clindamycin"
    ]
  ],
  [
    "maternal-fetal",
    "during",
    "Se solicita valoración fetal en esta gestante con infección e hipotensión. ¿Qué secuencia protege mejor la atención?",
    [
      "Completar el estudio fetal y después iniciar el soporte de perfusión materna.",
      "Completar el urocultivo y después iniciar el estudio de bienestar fetal.",
      "Estabilizar la temperatura y después revisar la necesidad de soporte materno.",
      "Estabilizar a la madre y coordinar valoración fetal de forma simultánea."
    ],
    3,
    "La estabilización materna no debe retrasarse por el estudio fetal. La valoración obstétrica se coordina en paralelo según los recursos y la gravedad.",
    [
      "action:fetal",
      "action:definitive"
    ]
  ],
  [
    "closing-priority",
    "final",
    "¿Qué información diferencia la gravedad de este caso frente a una infección urinaria sin compromiso sistémico?",
    [
      "La presencia de disuria y la localización del dolor durante la entrevista.",
      "La hipotensión y los datos de disfunción orgánica durante la valoración.",
      "La presencia de leucocitos y la localización del germen en el urocultivo.",
      "La frecuencia de micciones y la localización de molestias al orinar."
    ],
    1,
    "La localización urinaria no determina por sí sola la gravedad. La hipotensión y la disfunción orgánica sustentan la respuesta urgente descrita.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Si el urocultivo aún no está disponible al relevar a la paciente, ¿qué plan permite continuidad segura?",
    [
      "Comunicar muestras pendientes y mantener el plan indicado con revisión posterior.",
      "Comunicar muestras pendientes y suspender el plan hasta identificar el germen.",
      "Comunicar mejoría de la disuria y decidir tratamiento con el resultado definitivo.",
      "Comunicar mejoría de la fiebre y decidir ingreso con el resultado del cultivo."
    ],
    0,
    "Se documentan las muestras y el tratamiento para revisar el plan cuando haya resultados. La espera microbiológica no reemplaza la atención de la sepsis materna.",
    []
  ]
]),
  ...makeCaseQuestions("obs-09", "msp-obstetric", [
  [
    "clinical-decision",
    "during",
    "La puérpera presenta sepsis y probable infección de herida de cesárea. ¿Qué necesidad debe evaluarse además del tratamiento antimicrobiano?",
    [
      "La posibilidad de colección y el control quirúrgico del foco según los hallazgos.",
      "La posibilidad de hipotonía y la repetición del tratamiento uterotónico del puerperio.",
      "La posibilidad de dolor y el ajuste analgésico antes de estudiar el foco quirúrgico.",
      "La posibilidad de fiebre y el ajuste antipirético antes de revisar la herida local."
    ],
    0,
    "El tratamiento antimicrobiano no reemplaza el control de un foco quirúrgico cuando está indicado. La evaluación y posible intervención corresponden al equipo capacitado.",
    [
      "action:wound",
      "action:antibiotics",
      "action:med-ceftriaxone-metronidazole",
      "action:med-ampicillin-clindamycin"
    ]
  ],
  [
    "focus-location",
    "during",
    "La paciente no presenta loquios fétidos, pero sí datos de infección de herida e hipoperfusión. ¿Cómo interpretas esa combinación?",
    [
      "Reduce la sospecha de infección sistémica y orienta a una complicación superficial.",
      "Permite concentrar la evaluación en causas uterinas antes de revisar la herida.",
      "Reduce la prioridad del soporte y orienta a completar primero las curaciones locales.",
      "Mantiene la sospecha de sepsis con foco extrauterino y requiere evaluación integral."
    ],
    3,
    "La ausencia de un signo uterino no descarta sepsis puerperal de otro foco. Deben integrarse la herida, perfusión y disfunción orgánica.",
    [
      "action:definitive",
      "action:cultures"
    ]
  ],
  [
    "closing-priority",
    "final",
    "Si persiste deterioro a pesar del tratamiento inicial de la herida, ¿qué reevaluación aborda mejor una causa potencialmente pendiente?",
    [
      "La necesidad de ampliar la analgesia antes de revisar una posible colección.",
      "La necesidad de reforzar el uterotónico antes de revisar la infección de herida.",
      "La adecuación antimicrobiana y la necesidad de controlar una colección o tejido infectado.",
      "La adecuación antipirética y la necesidad de esperar la respuesta del siguiente turno."
    ],
    2,
    "El deterioro exige revisar tratamiento y control del foco, además del soporte. No se presupone que una curación o una pauta inicial hayan resuelto el proceso infeccioso.",
    []
  ],
  [
    "closing-safety",
    "final",
    "Al trasladar a esta paciente, ¿qué comunicación facilita que el equipo receptor continúe el control del foco?",
    [
      "La fiebre inicial, la curación realizada y la respuesta al último analgésico.",
      "El foco de herida, la perfusión, las muestras y las acciones de control pendientes.",
      "El dolor actual, la curación realizada y la presentación del material utilizado.",
      "La temperatura actual, la ingesta registrada y la respuesta al primer antitérmico."
    ],
    1,
    "El relevo debe conservar la sospecha de foco quirúrgico, la evolución orgánica y lo realizado o pendiente. Así permite continuar tratamiento y control de la causa.",
    []
  ]
]),
 ];
}
