# Catálogos, decisiones y preguntas clínicas

Actualización local: 18 de octubre de 2026. Rutas: `/critical-care` y `/clinical-room`.

## Opciones y funcionamiento

Cuidados críticos ofrece de 11 a 14 medicamentos por caso, organizados por familias: broncodilatadores, corticoides, antimicrobianos, vasoactivos, sedantes, analgésicos, metabólicos, diuréticos, antiagregantes, betabloqueantes y cristaloides. La presentación se selecciona antes de preparar y confirmar; no se simulan dosis reales ni equivalencia de concentraciones. Cambiar de presentación o de corticoide equivalente no elimina el tiempo de espera ni el límite de exposiciones.

La sala ginecológica añade al menos diez medicamentos por caso y selección de presentación; incluye alternativas uterotónicas, antihipertensivas y esquemas maternos según el caso. Una alternativa apropiada satisface la prioridad correspondiente sin permitir duplicar crédito o soporte cambiando de nombre. Se amplían pruebas e intervenciones, incluyendo opciones sin indicación y decisiones inseguras. La pertinencia depende del caso; los errores quedan registrados y algunos modifican el modelo fisiológico, con respuesta gradual. Las cifras y tiempos son aproximaciones educativas, no una predicción clínica validada.

En hipoglucemia, la vía oral requiere conciencia recuperada y una muestra favorable del cribado simulado de deglución. Un cribado antiguo no favorable no se convierte en favorable por cambiar la conciencia; se debe repetir. Si vuelve la alteración de conciencia, la vía oral vuelve a ser insegura.

Los diecisiete casos entre ambos módulos tienen preguntas relacionadas con decisiones concretas y exactamente dos preguntas finales, siempre con cuatro opciones y una respuesta. La primera respuesta confirmada queda fija. Las preguntas aparecen en un diálogo modal obligatorio que no se cierra con Escape ni al pulsar fuera. La atención, el reloj y la animación se pausan hasta confirmar una opción y pulsar Continuar. Al terminar, incluso por tiempo, las dos preguntas de cierre aparecen secuencialmente antes de obtener el resultado. La primera respuesta permanece fija y puede revisarse en Registro. Cada acierto suma 5 puntos y cada error resta 5 sobre la base clínica; la nota se limita a 0–100 y una omisión crítica conserva el límite de 69. El desglose y las respuestas se exportan junto a las decisiones y presentaciones. Las respuestas no modifican la fisiología.

## Fuentes y alcance

`src/lib/clinicalEducation.ts` reúne las referencias, fechas y límites. El usuario puede consultarlos en la ficha o entrega del caso y en la explicación posterior a cada pregunta.

- MSP, Score MAMÁ y Claves Obstétricas, 2025: claves roja, azul y amarilla; TANN, uterotónicos, antihipertensivos y alternativas antimicrobianas maternas del anexo 17.
- MSP, Diabetes mellitus tipo 2, 2017: hipoglucemia, corrección parenteral, glucagón y reevaluación.
- MSP, Lineamiento de ventilación mecánica, 2020: vigilancia y seguridad del soporte y sedación.
- MSP, Protocolos de atención prehospitalaria, 2011: referencia histórica para asma, choque, valoración y referencia. Se verificaron sus apartados; no se trasladan automáticamente sus dosis ni recomendaciones antiguas a UCI.
- MSP, Alergia a la proteína de la leche de vaca, 2016: algoritmo de anafilaxia y papel coadyuvante de antihistamínicos/corticoides. Su alcance principal es pediátrico/alimentario; no se presenta como guía general de anafilaxia adulta ni se extrapolan dosis.
- MSP, Componente Normativo Materno, 2008: referencia histórica de valoración y referencia obstétrica. No acredita un esquema específico de EIP grave.

No se verificó una GPC nacional MSP específica de EIP grave ni un esquema general de antimicrobianos para sepsis adulta. Estos casos conservan selección individualizada según protocolo institucional y referencias complementarias, con la limitación visible. La sepsis materna no se extrapola al paciente adulto general. Las decisiones del simulador necesitan revisión docente e institucional antes de usarse como evaluación clínica validada.

## Pacientes de apariencia fotográfica

Modo utilizado: herramienta integrada `image_gen`, generación nueva, fondo opaco; sin CLI ni recursos de terceros. Los originales PNG se convirtieron a JPEG para la web. Archivos definitivos:

- `public/critical-care/patient-realistic-v2.jpg` (1024 × 1536).
- `public/clinical-room/patient-realistic-v2.jpg` (1024 × 1536).

Especificaciones normalizadas del conjunto de prompts para reproducir los recursos:

> Paciente masculino adulto latino ficticio, aspecto fotográfico natural, aproximadamente 55 años, acostado boca arriba en camilla de urgencias. Vista cenital vertical 2:3, cuerpo centrado, ojos abiertos, expresión cansada, textura natural de piel y cabello. Bata hospitalaria modesta y sábana que cubren el cuerpo, brazos junto a los costados y manos anatómicamente correctas. Almohada blanca, barandas y entorno hospitalario discreto, luz suave. Sin desnudez, sangre, lesiones, textos, logotipos ni marcas de agua. Sin equipo conectado; el programa añade los elementos de atención. Apariencia de persona real, sin caricatura ni maniquí.

> Paciente femenina adulta latina ficticia, apariencia fotográfica natural, recostada boca arriba en camilla de urgencias. Vista cenital vertical 2:3, cuerpo centrado, ojos abiertos, expresión cansada, piel y cabello realistas. Bata hospitalaria modesta y sábana que cubren torso y piernas; manos visibles y correctas. Almohada blanca y barandas, luz hospitalaria suave, fondo discreto. Sin desnudez, sangre, heridas, texto, logos ni marcas de agua. Sin equipo conectado, para superponer oxígeno, acceso IV y TANN desde la interfaz. Sin estética de caricatura o maniquí.

Son imágenes sintéticas compartidas por los casos de cada módulo, no identidades ni modelos anatómicos individuales. Cuidados críticos conserva la capa respiratoria y la vista ilustrada alternativa; la sala ginecológica superpone dispositivos. No se integró un paciente 3D articulado.

## Validación

```sh
node --test tests/clinicalEducation.test.mjs tests/gynecologySimulation.test.mjs scripts/test-critical-care.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build --webpack
```

72 comprobaciones del motor y cuestionarios: alternativas equivalentes, presentaciones inválidas, bloqueo de duplicados, daño por elecciones inseguras, muestras de deglución, preguntas de los diecisiete casos y conservación de la primera respuesta. Revisión Chrome: selección y administración de presentación, pregunta disparada, recuperación de pregunta pospuesta, cuestionarios finales de ambos módulos, imágenes y ausencia de desbordamiento horizontal en 390 y 768 px.

## Sala interactiva ginecológica y movimiento

La página, el catálogo y la navegación usan el nombre **Sala interactiva ginecológica**. La sala ocupa la ventana con monitor a la izquierda, paciente central y herramientas a la derecha; la barra inferior abre valoración, estudios, intervención, medicación, equipo y claves/TANN en los casos obstétricos. El panel Caso conserva la entrega de turno, modalidad y fuentes. Ampliar paciente oculta las herramientas; elegir una herramienta las vuelve a abrir. En móvil, el monitor queda arriba, la paciente en el centro y las herramientas debajo, con desplazamiento interno.

ECG/FC, PA, SpO₂, FR y temperatura comienzan sin medir. Cada conexión guarda su instante y no modifica la fisiología ni cuenta como tratamiento. Desconectar oculta la lectura y reconectar muestra la evolución actual. El índice de choque y las tendencias requieren FC y PA conectadas; las tendencias parten de esas conexiones. Las comparaciones no revelan cifras previas de sensores desconectados. Reiniciar borra las conexiones. No se inventan valores de capnografía para el motor ginecológico.

Ambas fotografías tienen una capa torácica enmascarada con expansión suave, a una duración de 60/FR segundos por ciclo. No se escala la camilla ni la imagen entera. El movimiento se pausa con el caso y se desactiva con la preferencia del sistema de movimiento reducido. Sigue siendo una representación 2D ilustrativa.

Revisión adicional en Chrome: bloqueo de Escape/fondo y ausencia de opción de posponer, reloj y respiración congelados en la pregunta, respuesta errónea con descuento, dos preguntas finales consecutivas, puntuación exportada, conexión/desconexión/reinicio de sensores, dimensiones de paciente y monitor, anchos 320/390/768/1024, claves roja/azul/amarilla y elección de presentación de oxitocina.

## Casos obstétricos adicionales y cierre de cuidados críticos

La sala ginecológica contiene ahora 11 casos: dos ginecológicos y nueve obstétricos, tres por cada clave. El selector permite filtrar por clave y muestra un resumen antes de preparar el escenario.

| ID | Clave | Situación | Diferencia en la atención |
| --- | --- | --- | --- |
| obs-04 | Roja | Sangrado con útero firme tras parto instrumental | Buscar trauma y coordinar reparación; masaje/uterotónicos adicionales no reducen la pérdida del modelo. |
| obs-05 | Roja | Alumbramiento incompleto con hemorragia | Soporte del tono y control de tejido retenido por el equipo capacitado. |
| obs-06 | Azul | Convulsión reciente en el embarazo | Seguridad de vía aérea, magnesio y presión; la vía oral posictal no satisface la prioridad antihipertensiva. |
| obs-07 | Azul | Hipertensión grave en el quinto día del puerperio | Vigilancia e ingreso materno; no incluye valoración fetal ni finalización de una gestación ya terminada. |
| obs-08 | Amarilla | Sepsis de probable origen urinario durante el embarazo | Muestras sin retrasar tratamiento, evaluación del foco y bienestar fetal. |
| obs-09 | Amarilla | Sepsis de probable foco en herida poscesárea | Valoración del foco quirúrgico y control por el equipo según hallazgos. |

Cada caso tiene historia, hallazgos, muestras, prioridades, alternativas farmacológicas, opciones incorrectas, una pregunta durante la atención y dos preguntas finales propias. Se reutilizan los equipos de respuesta por clave y se ajusta el tratamiento causal; no se simulan dosis. Referencia clínica: MSP 2025, claves roja/azul/amarilla, valoración ABCDE y anexos pertinentes. La escala fisiológica sigue siendo una aproximación educativa.

En cuidados críticos, completar las preguntas finales abre automáticamente un diálogo amplio con puntuación, prioridades pendientes, respuestas, decisiones y registro cronológico. Se puede descargar, volver a la sala finalizada, repetir el caso o regresar a la biblioteca para elegir otro. El botón Ver resultado vuelve a abrir el resumen después de cerrarlo.

Niveles de ayuda antes de iniciar: Guiada (mensajes y puntos), Autónoma (sin mensajes, con puntos) y Desafío (sin guía ni puntos). Los puntos se pueden configurar de forma independiente y la orientación se puede activar o desactivar desde Vista. La guía propone el siguiente paso según la actividad; no administra tratamientos automáticamente. La fotografía respeta la preferencia de puntos ocultos igual que la ilustración. La dificultad no cambia las reglas de puntuación ni elimina las preguntas obligatorias, y se incluye en el registro descargado.

Validación ampliada: 72 pruebas del motor/educación y revisión Chrome de los filtros (tres casos por clave), pregunta de trauma, ausencia de puntos y guía en desafío, exploración mediante botones, modo guiado y flujo de resultado → volver/reabrir/repetir/otro caso en escritorio y móvil.

## Movimiento facial y TANN por segmentos

Las fotografías usan ahora una capa torácica más visible, sincronizada con FR, y dos capas faciales enmascaradas: parpadeo cada pocos segundos y una expresión suave de molestia. Las capas faciales usan una variante del mismo paciente; solo se funden ojos/cejas y boca, conservando la fotografía base del resto del cuerpo. Los puntos de cabeza se desplazaron al lado del rostro. El acercamiento en cuidados críticos conserva la vista elegida. La ilustración alternativa mantiene su animación propia.

La pausa y los cuestionarios detienen todas las capas; la preferencia del sistema de movimiento reducido las desactiva. La expresión es ilustrativa, no mide dolor ni implica recuperación neurológica. En cuidados críticos se suprimen las capas faciales cuando el Glasgow del modelo está por debajo de 10. No se incorporó un modelo 3D.

En los tres casos de clave roja se practica el TANN desde **Claves y TANN**. El caso **Sangrado después del parto** incluye la práctica completa. Primero se solicita consentimiento, se activa la respuesta roja, se valora indicación/contraindicaciones y se prepara la paciente en decúbito supino. La representación agrupa ambos miembros inferiores en cada nivel: tobillos, pantorrillas, muslos, pelvis, abdomen con esfera y fijación. El orden está bloqueado por dependencias. Cada acción añade su componente al dibujo sobre la paciente. Los números representan esta agrupación educativa; la colocación real depende del dispositivo y de personal capacitado.

Después de los seis componentes hay una verificación final de cierres, esfera, posición y tolerancia. Solo entonces el motor registra el soporte temporal del TANN. Los componentes parciales no otorgan el efecto completo; no se revierten pérdidas sanguíneas previas. Se conserva la opción incorrecta de retiro durante el choque con su penalización y desaparición del traje. El registro JSON incluye los pasos con tiempo y el resumen `tann` (count, prepared, verified, removed). Reiniciar borra todo el procedimiento. Referencia verificada: MSP 2025, anexo 8, páginas del PDF 74–75.

### Recursos de expresión generados

Herramienta: `image_gen` integrada, modo de edición con la fotografía correspondiente como referencia, fondo opaco. JPEG derivados con `sips` para uso web; no se sobrescribieron las bases.

- Archivo final: `public/critical-care/patient-expression-v3.jpg` (1024 × 1536).
- Archivo final: `public/clinical-room/patient-expression-v3.jpg` (1024 × 1536).

Prompt exacto utilizado para ambas ediciones:

> Edit this exact reference hospital photograph for a web patient animation. Preserve the same fictional person, identity, face location, head angle, body position, lighting, bed, clothing, blanket, framing and exact 1024x1536 composition. Change ONLY the facial expression: close both eyes naturally with realistic eyelids as during a blink, and add a mild brief discomfort expression with slightly pressed lips and lightly furrowed brow. The head must remain exactly aligned with the reference, no rotation or scale change. No new objects, no text. Return one full photograph matching the reference so software can mask just the eyes and mouth and blend this frame over the original.

### Validación adicional

```sh
node --test tests/tannPlacement.test.mjs tests/clinicalEducation.test.mjs tests/gynecologySimulation.test.mjs scripts/test-critical-care.mjs
```

77 pruebas: secuencia y dependencias en los tres casos rojos, bloqueo de saltos y duplicados, verificación antes del soporte, pérdidas históricas, retiro prematuro, pausa y reinicio. Chrome comprueba las tres capas de movimiento en ambos módulos, congelación y movimiento reducido, seis componentes visibles, verificación, exportación ordenada y reinicio; también se revisó la vista móvil.
