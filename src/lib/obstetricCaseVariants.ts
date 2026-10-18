import type { GynecologyCase, SimulationAction } from "./gynecologySimulation";

/** New situations reuse the response teams, not the causal treatment of another diagnosis. */
export function additionalObstetricCases(bases: GynecologyCase[]): GynecologyCase[] {
 const base=(id:string)=>bases.find(c=>c.id===id)!;
 const red=base("obs-01"), blue=base("obs-02"), yellow=base("obs-03");
 const source=blue.source;
 const revise=(c:GynecologyCase,changes:Record<string,Partial<SimulationAction>>,omit:string[]=[])=>c.actions.filter(a=>!omit.includes(a.id)).map(a=>({...a,...changes[a.id]}));
 const study=(id:string,label:string,result:string):SimulationAction=>({id,label,group:"estudios",minutes:.5,result,rationale:"Interpretar junto al cuadro clínico; no demorar la estabilización ni el control de la causa."});
 const fetal:SimulationAction={id:"fetal",label:"Coordinar valoración materna y bienestar fetal",group:"estudios",requires:["call"],critical:true,minutes:.5,result:"El equipo inicia valoración fetal en paralelo al soporte materno.",rationale:"La estabilización materna y la valoración fetal requieren coordinación sin retrasar el tratamiento urgente."};
 return [
  {...red,id:"obs-04",title:"Sangrado persistente con útero contraído",name:"Sofía C.",age:25,uterotonicIndicated:false,
   background:"G1P1 · 40 minutos después de parto instrumental",complaint:"Sigo sangrando y me siento cada vez más mareada.",
   handover:"Sangrado rojo persistente tras parto instrumental, pese a útero firme y placenta descrita completa. Pérdida inicial de 1.000 mL con hipoperfusión.",
   initial:{hr:124,sbp:88,dbp:54,spo2:94,rr:27,temp:36.2},bleeding:1000,bleedingRate:75,deterioration:1.7,
   diagnosis:"Hemorragia posparto por trauma del canal del parto",differentials:["Hemorragia posparto con sospecha de atonía uterina","Retención de tejido placentario con hemorragia","Coagulopatía obstétrica"],
   findings:{head:"Palidez, mareo y ansiedad, con respuesta verbal conservada.",chest:"Pulsos rápidos y débiles; llenado capilar prolongado.",abdomen:"Útero firme y bien contraído. El sangrado continúa pese al tono conservado.",pelvis:"Con consentimiento: sangrado activo del canal del parto y sospecha de lesión cervical o vaginal. Requiere evaluación y reparación por personal capacitado."},
   history:"Parto instrumental reciente, sin alergias conocidas. La placenta se informó completa. El tono uterino se mantiene firme; persiste pérdida sanguínea.",
   actions:[...revise(red,{
    quantify:{result:"Se cuantifica la pérdida y revisan las 4 T. Tono conservado y sospecha de trauma; no atribuir toda hemorragia a atonía."},
    massage:{critical:false,effect:undefined,judgment:"unnecessary",result:"El útero ya está contraído. El masaje no controla una lesión del canal del parto.",rationale:"Con tono conservado, insistir solo en masaje retrasa la búsqueda y reparación del trauma."},
    uterotonic:{critical:false,effect:undefined,judgment:"unnecessary",result:"Un uterotónico adicional no repara una lesión del canal del parto.",rationale:"El útero está firme; el tratamiento debe dirigirse a la causa y no limitarse a repetir uterotónicos."},
    definitive:{label:"Coordinar revisión y reparación urgente del canal del parto",result:"El equipo coordina exposición, revisión y reparación de la lesión, con soporte transfusional según respuesta.",rationale:"El trauma requiere control por personal capacitado; el soporte circulatorio y el TANN no reparan la lesión."},
    labs:{result:"Hb 9,1 g/dL · plaquetas 190.000/µL · fibrinógeno 240 mg/dL. Una Hb aislada no cuantifica la pérdida aguda."},
   }),study("coagulation","Solicitar coagulación y fibrinógeno","INR 1,1 · fibrinógeno 240 mg/dL. Continuar vigilancia durante el sangrado.")],
   objectives:["Reconocer la clave roja con tono uterino conservado","Distinguir trauma de atonía","Coordinar reparación y soporte sin retrasos"],source},
  {...red,id:"obs-05",title:"Alumbramiento incompleto y sangrado",name:"Mariana V.",age:33,uterotonicIndicated:true,
   background:"G3P3 · 35 minutos después de parto vaginal",complaint:"Tengo mucho sangrado y me cuesta mantenerme despierta.",
   handover:"La revisión placentaria sugiere un cotiledón faltante. Hay sangrado activo, útero poco contraído e hipotensión. Pérdida inicial de 1.100 mL.",
   initial:{hr:122,sbp:84,dbp:50,spo2:93,rr:28,temp:36.1},bleeding:1100,bleedingRate:70,deterioration:1.9,
   diagnosis:"Retención de tejido placentario con hemorragia",differentials:["Hemorragia posparto por trauma del canal del parto","Hemorragia posparto con sospecha de atonía uterina","Coagulopatía obstétrica"],
   findings:{head:"Somnolencia, palidez y sensación de desmayo.",chest:"Taquipnea, taquicardia y pulsos débiles.",abdomen:"Útero blando y aumentado de tamaño; respuesta parcial al masaje.",pelvis:"Sangrado activo. La inspección de placenta y membranas sugiere tejido faltante; la extracción corresponde al equipo capacitado."},
   history:"Placenta expulsada aparentemente incompleta. No hay alergias conocidas. La paciente requiere estabilización y atención obstétrica resolutiva inmediata.",
   actions:[...revise(red,{
    quantify:{result:"Se confirma pérdida activa y revisión de las 4 T: destaca tejido placentario faltante con hipotonía asociada."},
    definitive:{label:"Coordinar extracción de tejido retenido por el equipo obstétrico",result:"Se coordina control del tejido retenido en un entorno con personal capacitado y recursos para atender la hemorragia.",rationale:"Los uterotónicos pueden apoyar el tono; no sustituyen el control del tejido retenido."},
    labs:{result:"Hb 8,5 g/dL · plaquetas 155.000/µL · fibrinógeno 190 mg/dL. Integrar con la pérdida activa."},
   }),study("placental-review","Documentar integridad de placenta y membranas","Se identifica un cotiledón faltante. La evaluación orienta el control de la causa sin demorar la estabilización.")],
   objectives:["Reconocer tejido retenido dentro de las 4 T","Activar clave roja y anticipar sangre","Coordinar control del tejido y reevaluación"],source},
  {...blue,id:"obs-06",oralRouteUnsafe:true,title:"Convulsión durante el embarazo",name:"Paula L.",age:22,
   background:"G1P0 · embarazo de 35 semanas · convulsión reciente",complaint:"Me duele mucho la cabeza… ¿qué me pasó?",
   handover:"Convulsión generalizada presenciada hace dos minutos, ahora en período posictal. PA 178/116 mmHg, saturación 91 % y antecedentes de cefalea y escotomas.",
   initial:{hr:118,sbp:178,dbp:116,spo2:91,rr:28,temp:36.9},deterioration:1.5,
   diagnosis:"Eclampsia anteparto",differentials:["Epilepsia","Hipoglucemia con convulsión","Evento cerebrovascular"],
   findings:{head:"Somnolienta pero responde tras la convulsión. Sin traumatismo evidente; requiere vigilancia neurológica y de vía aérea.",chest:"Taquipnea e hipoxemia; vigilar ventilación y riesgo de aspiración.",abdomen:"Útero gestante; dolor epigástrico referido antes de la convulsión.",pelvis:"Sin sangrado ni pérdida de líquido. Coordinar valoración fetal tras priorizar estabilización materna."},
   history:"Cefalea y visión borrosa desde la mañana, sin epilepsia conocida. Convulsión ya finalizada. Verificar glucemia y causas alternativas sin retrasar la respuesta obstétrica.",
   actions:[...revise(blue,{
    magnesium:{label:"Coordinar sulfato de magnesio para eclampsia y vigilar toxicidad",result:"Se coordina tratamiento anticonvulsivante según protocolo, con vigilancia de respiración, reflejos y diuresis.",rationale:"La eclampsia requiere tratamiento de convulsiones y vigilancia; el antihipertensivo no sustituye el magnesio."},
    labs:{result:"Plaquetas 105.000/µL · AST 82 U/L · creatinina 1,1 mg/dL. Integrar con daño orgánico y vigilancia neurológica."},
   }),{id:"seizure-safety",label:"Proteger vía aérea y prevenir lesiones tras la convulsión",group:"intervencion",critical:true,deadline:90,result:"Se coordina posicionamiento seguro, valoración de vía aérea y respiración y prevención de lesiones; no se introducen objetos en la boca.",rationale:"La valoración ABCDE y la protección de la paciente acompañan el tratamiento anticonvulsivante."},study("glucose","Solicitar glucemia capilar","Glucemia del caso: 96 mg/dL. Valorar causas alternativas sin retrasar la estabilización.")],
   objectives:["Reconocer eclampsia y activar clave azul","Priorizar vía aérea y tratamiento anticonvulsivante","Controlar hipertensión y coordinar resolución obstétrica"],source},
  {...blue,id:"obs-07",title:"Cefalea intensa en el puerperio",name:"Elena D.",age:36,
   background:"G2P2 · quinto día después del parto",complaint:"Desde ayer me duele muchísimo la cabeza y veo borroso.",
   handover:"Consulta en el quinto día del puerperio por cefalea intensa, visión borrosa y PA repetida de 170/114 mmHg. No refiere hipertensión durante el embarazo.",
   initial:{hr:98,sbp:170,dbp:114,spo2:95,rr:24,temp:36.7},deterioration:1.3,
   diagnosis:"Preeclampsia con signos de severidad en el puerperio",differentials:["Migraña","Evento cerebrovascular","Infección puerperal"],
   findings:{head:"Cefalea persistente, escotomas e hiperreflexia; sin déficit focal evidente.",chest:"Taquipnea leve. Vigilar edema pulmonar y respuesta al tratamiento.",abdomen:"Dolor en hipocondrio derecho, útero en involución.",pelvis:"Loquios escasos sin mal olor. El parto previo no excluye una urgencia hipertensiva actual."},
   history:"Parto hace cinco días, sin hipertensión previamente diagnosticada. Cefalea que no mejora con analgésico habitual y disminución de diuresis.",
   actions:[...revise(blue,{
    labs:{result:"Plaquetas 98.000/µL · AST 110 U/L · creatinina 1,3 mg/dL. Hallazgos de compromiso orgánico."},
    definitive:{label:"Coordinar ingreso y atención especializada de la hipertensión puerperal",result:"Se coordina ingreso para vigilancia y manejo materno especializado; no hay una gestación en curso que finalizar.",rationale:"El puerperio mantiene riesgo de complicaciones hipertensivas; requiere tratamiento y seguimiento materno."},
   },["fetal"]),{id:"neurologic",label:"Reevaluar conciencia y signos neurológicos de alarma",group:"valoracion",critical:true,result:"Se documentan conciencia, pupilas y ausencia de déficit focal en esta valoración; mantener reevaluación y escalar cambios.",rationale:"Una cefalea intensa con hipertensión puerperal necesita vigilancia neurológica y evaluación de diagnósticos alternativos."}],
   objectives:["Reconocer hipertensión grave después del parto","Activar clave azul y prevenir convulsiones","Coordinar ingreso y vigilancia materna"],source},
  {...yellow,id:"obs-08",title:"Fiebre y dolor lumbar durante el embarazo",name:"Isabel T.",age:30,
   background:"G2P1 · embarazo de 28 semanas",complaint:"Me arde al orinar, tengo escalofríos y dolor fuerte en la espalda.",
   handover:"Fiebre de 39,1 °C, dolor lumbar derecho y disuria. Presenta hipotensión, taquipnea y diuresis disminuida, con sospecha de infección urinaria complicada y sepsis materna.",
   initial:{hr:128,sbp:86,dbp:50,spo2:94,rr:29,temp:39.1},deterioration:1.7,
   diagnosis:"Sepsis materna de probable origen urinario",differentials:["Infección urinaria sin disfunción orgánica","Apendicitis","Infección intraamniótica"],
   findings:{head:"Fatiga, orientación fluctuante y mucosas secas.",chest:"Taquicardia, taquipnea y llenado capilar prolongado.",abdomen:"Dolor a la puñopercusión lumbar derecha; sin dolor uterino predominante.",pelvis:"Sin sangrado ni pérdida de líquido referidos. Coordinar bienestar fetal sin retrasar la atención materna."},
   history:"Disuria de tres días y fiebre desde ayer, con escalofríos y vómitos. Sin tratamiento previo; verificar alergias y antecedentes de resistencia antimicrobiana.",
   actions:[...revise(yellow,{
    labs:{result:"Leucocitos 21.500/µL · lactato 4,0 mmol/L · creatinina 1,7 mg/dL. Datos de disfunción orgánica."},
    definitive:{label:"Coordinar evaluación del foco urinario y cuidados críticos",result:"Se solicita evaluación especializada del foco, posible obstrucción y soporte avanzado según respuesta.",rationale:"La sepsis exige tratar la infección, evaluar el foco y escalar soporte si persiste hipoperfusión."},
   }),study("urine","Solicitar examen de orina y urocultivo sin demorar el tratamiento","Piuria y nitritos positivos en muestra simulada; urocultivo remitido. El resultado microbiológico definitivo queda fuera de la sesión."),fetal],
   objectives:["Reconocer sepsis materna con foco urinario","Activar clave amarilla y coordinar antimicrobianos tempranos","Reevaluar perfusión, diuresis y bienestar fetal"],source},
  {...yellow,id:"obs-09",title:"Fiebre y dolor en la herida de cesárea",name:"Gabriela N.",age:32,
   background:"G2P2 · séptimo día después de cesárea",complaint:"La herida me duele cada vez más y sale una secreción que huele mal.",
   handover:"Fiebre, dolor progresivo en herida quirúrgica, secreción purulenta e hipotensión. Presenta confusión reciente y requiere evaluación de sepsis materna con foco quirúrgico.",
   initial:{hr:130,sbp:82,dbp:48,spo2:92,rr:30,temp:39.3},deterioration:1.8,
   diagnosis:"Sepsis puerperal de probable foco en herida de cesárea",differentials:["Endometritis puerperal","Infección superficial sin sepsis","Infección urinaria complicada"],
   findings:{head:"Desorientación nueva, palidez y escalofríos.",chest:"Taquipnea, pulsos débiles e hipoperfusión periférica.",abdomen:"Herida de cesárea con eritema, dolor y secreción; precisa valoración de profundidad y posible colección por el equipo.",pelvis:"Loquios sin mal olor ni sangrado abundante. La ausencia de signos uterinos no excluye otro foco infeccioso."},
   history:"Cesárea hace siete días. Dolor de herida y fiebre progresivos; revisar profilaxis, tratamientos previos, alergias y comorbilidades.",
   actions:[...revise(yellow,{
    labs:{result:"Leucocitos 24.000/µL · lactato 4,6 mmol/L · creatinina 1,9 mg/dL. Integrar con hipotensión y alteración de conciencia."},
    definitive:{label:"Coordinar valoración quirúrgica y control del foco de la herida",result:"El equipo obstétrico-quirúrgico evalúa drenaje o desbridamiento según hallazgos, junto con soporte avanzado.",rationale:"Los antibióticos no reemplazan el control de un foco quirúrgico cuando está indicado."},
   }),study("wound","Solicitar evaluación de colección y muestras del foco","Evaluación dirigida de la herida y posible colección solicitada. Se remiten muestras pertinentes sin demorar antimicrobianos.")],
   objectives:["Reconocer sepsis puerperal con foco quirúrgico","Activar clave amarilla y estabilizar","Coordinar antimicrobianos y control del foco"],source},
 ];
}
