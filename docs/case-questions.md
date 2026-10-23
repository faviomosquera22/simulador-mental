# Preguntas clínicas por caso

Revisión local del 22 de octubre de 2026. Los 7 casos de cuidados críticos y los 11 de ginecología/obstetricia disponen de 4 preguntas cada uno: 2 durante la atención y 2 de cierre. Total: 72 preguntas.

## Contenido y presentación

Los enunciados utilizan antecedentes, hallazgos, decisiones y posibles cambios de cada caso. Las alternativas comparan interpretaciones, prioridades, secuencias o cálculos clínicos. Se retiraron respuestas de una palabra, distractores ajenos al problema y la pregunta genérica de cierre que se repetía en todos los escenarios.

Las cuatro opciones de cada pregunta tienen longitudes comparables: en esta revisión, la relación máxima entre la más larga y la más corta es inferior a 1,20 y la diferencia de palabras no supera 4. Las opciones ocupan filas de igual altura en escritorio y móvil, sin truncamiento ni relleno artificial.

El orden varía por identificador de pregunta mediante una permutación estable independiente de la clave. Las letras visibles no cambian la identidad de la respuesta: la selección y la corrección se realizan por ID. La misma pregunta conserva su orden al consultarse en el historial.

Las explicaciones y referencias aparecen después de confirmar. Las claves, explicaciones y distractores requieren revisión docente continua; la semejanza de longitud no constituye una validación psicométrica de dificultad.

## Aparición durante la práctica

Las preguntas se activan por decisiones clínicas aceptadas o por hitos del caso. Como respaldo, la primera queda disponible después de 3 decisiones y la segunda después de 6; los disparadores específicos pueden anticiparlas. Los sensores, el tiempo transcurrido y los clics rechazados no cuentan como decisiones.

Cuidados críticos incluye eventos de oxígeno y colocación del TANN, además de acciones, medicamentos, estudios y ajustes aceptados del ventilador. Ginecología conserva sus decisiones y requisitos de colocación. Al aparecer una pregunta, se pausa el caso; responder y continuar no realiza tratamientos adicionales. Las preguntas respondidas no vuelven a bloquear la atención. El cierre conserva sus dos preguntas obligatorias.

Se mantiene la puntuación: +5 por acierto, −5 por error y los límites existentes de nota, incluidas las omisiones críticas. Las alternativas no se marcan como correctas por su posición visual.

## Fuentes

Cada explicación tiene una referencia visible. Se mantienen los protocolos MSP utilizados en los casos y se añaden referencias específicas para los siguientes temas:

- [GINA 2026: exacerbaciones asmáticas](https://ginasthma.org/wp-content/uploads/2026/05/GINA-2026-Strategy-Report-WMS.pdf).
- [NICE NG128: evaluación inicial del ACV y seguridad de deglución](https://www.nice.org.uk/guidance/ng128/chapter/recommendations).
- [SCCM/ESICM 2026: sepsis adulta](https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026).
- [Resuscitation Council UK: anafilaxia](https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment-anaphylactic-reactions).
- [CDC: enfermedad inflamatoria pélvica](https://www.cdc.gov/std/treatment-guidelines/pid.htm).

La redacción no introduce dosis terapéuticas ni convierte las respuestas fisiológicas simplificadas en recomendaciones individuales.

## Verificación reproducible

- `tests/clinicalEducation.test.mjs`: cobertura de los 18 casos, dos preguntas por etapa, longitud, referencias, distribución de posiciones, claves, no repetición, progreso y puntuación.
- `scripts/test-case-questions-browser.cjs`: preguntas de asma y TANN ginecológico durante la atención y al cierre, pausa real del reloj, bloqueo de Escape, confirmación, retroalimentación correcta/incorrecta, bloqueo posterior y altura uniforme de opciones a 1440 y 390 px.
- Las pruebas de preparación y del traje continúan verificando que responder no impide seguir usando oxígeno, medicación o TANN.
