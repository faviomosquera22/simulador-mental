# Práctica interactiva de medicamentos

La ruta `/medications` ofrece 30 casos breves: diez por nivel fácil, medio y difícil. El botiquín tiene 29 medicamentos, buscador por nombre, sinónimo, familia o concentración y presentaciones con su vía. Los casos se extraen sin repetición hasta agotar el nivel y evitan repetir inmediatamente al reiniciar la ronda. «Órdenes y cálculo» conserva la práctica anterior.

## Dosis y evaluación

El estudiante selecciona medicamento, presentación y **dosis total** sin selección automática. El menú depende del fármaco y presentación, nunca de la respuesta correcta del caso. Enalapril ofrece, entre otras, 10, 20 y 25 mg; no se ofrecen esas cantidades indiscriminadamente para todos los medicamentos. Glucosa usa g, insulina UI, potasio mEq y SRO mL. Salbutamol distingue mg inhalados por pulsación frente a nebulización. La presentación puede mostrar mg/mL o mg por comprimido; no se confunde con la cantidad total administrada.

El plan individual del caso aporta la pauta que se debe ejecutar, incluidos vía, frecuencia o contexto cuando son necesarios. Las cantidades equivalentes se calculan a partir de la presentación y se muestran en preparación, confirmación y registro. No validan fraccionamiento de comprimidos, dilución, velocidad, disponibilidad comercial ni una pauta completa. Preparar, cancelar o cambiar de presentación no administra; cambiar de caso o medicamento borra la dosis anterior.

La evaluación exige medicamento + vía + dosis y unidad compatibles. Una dosis incorrecta con medicamento y vía correctos obtiene 60/100 y revisión; una vía incorrecta obtiene 30/100 si el medicamento coincide; ninguna obtiene un acierto ni aumenta la racha. Retener un tratamiento es una decisión completa: no administrar no equivale a abandonar la atención. Se muestran criterios, explicación, selección exacta, respuesta compatible si hay error y referencias sólo tras confirmar.

## Casos añadidos

| Nivel | Casos nuevos | Objetivo |
|---|---|---|
| Fácil | Inicio de HTA, mantenimiento de IECA, diurético tiazídico, inicio de DM2, reflujo, control de lípidos | Amlodipino 5 mg, enalapril 10 mg, clortalidona 25 mg, metformina 500 mg, omeprazol 20 mg, atorvastatina 20 mg, según cada orden |
| Medio | Titulación de HTA, infarto con ST elevado, congestión, neumonía, sustitución por ARA-II, titulación de IECA | Amlodipino 10 mg, carga de AAS 300 mg, furosemida 20 mg IV, amoxicilina 500 mg, losartán 50 mg, enalapril 20 mg |
| Difícil | Prevención tras ACV isquémico, ACV sin TC, ACV hemorrágico, infarto sin ST elevado, interacción con nitrato, estatina tras infarto | Diferenciar mantenimiento de AAS, retener órdenes inseguras, carga individual de clopidogrel y prevención secundaria |

Los doce casos anteriores ahora evalúan también la dosis. Ejemplos: 15 g de glucosa oral; 20 g IV al 10 % (200 mL) o glucagón 1 mg IM conforme al plan; adrenalina 0,5 mg IM en adulto; paracetamol 1 g IV en adulto de 70 kg sin factores de riesgo. La SRO sigue una orden de volumen fraccionado, no una dosis universal de rehidratación.

## Referencias y límites de atribución

Consultadas el 23 de octubre de 2026. La app muestra nombre, año y sección en cada respuesta. Los casos son ficticios y las órdenes están individualizadas; no se presenta una dosis como regla universal para el diagnóstico.

- [MSP, GPC Hipertensión arterial, 2019](https://www.salud.gob.ec/wp-content/uploads/2019/06/gpc_hta192019.pdf): anexo 15, pp. 60–65. Clortalidona, enalapril, losartán y amlodipino; sus dosis y controles no se extrapolan al ACV agudo.
- [MSP, GPC Diabetes mellitus tipo 2, 2017](https://www.salud.gob.ec/wp-content/uploads/2017/02/Diabetes-mellitus-130117.pdf): hipoglucemia, p. 39; glucagón, p. 81; metformina, p. 85. Incluye glucosa IV al 10 %, 10–20 g, y glucagón 1 mg IM/SC en su anexo.
- [MSP, Registro terapéutico, 9.ª revisión, 2014](https://www.salud.gob.ec/wp-content/uploads/downloads/2014/10/Registro-Terapeutico-del-CNMB-9na-revision.pdf): monografías de enoxaparina, AAS, clopidogrel, furosemida, atorvastatina y otros medicamentos. Es una **referencia histórica**, no una nueva GPC ni evidencia de que se haya verificado la vigencia de todos sus esquemas. Las cargas del caso corresponden al plan clínico descrito; no se generalizan a cualquier estrategia de reperfusión.
- [NICE NG128, ictus y AIT](https://www.nice.org.uk/guidance/NG128/chapter/recommendations): imagen, deglución y antiagregación. Los casos con déficit persistente sin imagen y hemorragia confirmada exigen retener la orden antiagregante y continuar la atención urgente. No simulan una prescripción de trombólisis.
- [NICE NG185, síndromes coronarios](https://www.nice.org.uk/guidance/NG185/chapter/recommendations) y [NG238, prevención cardiovascular](https://www.nice.org.uk/guidance/ng238/chapter/recommendations): complementan carga de AAS y estatina de alta intensidad tras infarto.
- [NICE NG250, neumonía, 2025](https://www.nice.org.uk/guidance/ng250/chapter/Recommendations): tabla de antibióticos para adultos, neumonía de baja gravedad. No se extrapola la GPC pediátrica del MSP al adulto.
- [AEMPS, paracetamol 10 mg/mL](https://cima.aemps.es/cima/dochtml/ft/80117/FT_80117.html): sección 4.2, peso, factores de riesgo, dosis y perfusión de 15 minutos.
- [RCUK, anafilaxia, 2021](https://www.resus.org.uk/sites/default/files/2021-05/Emergency%20Treatment%20of%20Anaphylaxis%20May%202021_0.pdf), [GINA 2026](https://ginasthma.org/wp-content/uploads/2026/05/GINA-2026-Strategy-Report-WMS.pdf), NHS y CDC: fuentes complementarias identificadas en los casos originales. No se atribuyen al MSP.

## Verificación

`tests/medicationChallenges.test.mjs` recorre todas las combinaciones de caso, medicamento, presentación y dosis; comprueba unidades, conversiones, decimales, dosis ausentes o inválidas, repetición y situaciones que exigen retener. `scripts/test-medication-challenges-browser.cjs` recorre los 30 casos, todos los niveles, dosis correcta e incorrecta, confirmación/cancelación, resultados, búsqueda, vista móvil y retorno a los ejercicios anteriores.
