# Prototipo de primeros auxilios psicológicos

Ruta local: `/psychological-first-aid`. También figura como **prototipo** en Escenarios y urgencias y en el catálogo de módulos. No cambia el simulador de entrevista de salud mental ni los simuladores de cuidados críticos o ginecología.

## Alcance

Un caso ficticio: Valeria, 28 años, tras un accidente de tránsito, busca información sobre su hermana. Dos variantes: preocupación e incertidumbre, o aparición de un dolor torácico nuevo que requiere valoración médica. La llamada al apoyo elegido y la entrega al equipo se representan mediante respuestas del guion, no llamadas ni solicitudes reales.

Escena Three.js con personaje humano articulado y texturizado. Reposo y marcha se mezclan al cambiar de conducta. El personaje camina por una ruta, se orienta para escuchar, marca un límite y protesta mediante secuencias corporales, se aparta cuando rechaza continuar o acerca una mano al rostro mientras sigue afectado. Los gestos se mezclan sobre los clips existentes mediante objetivos de manos y cinemática inversa de dos segmentos; se conservan las longitudes de los brazos. La reparación del vínculo es gradual y requiere intervenciones distintas; repetir disculpas no lo restablece automáticamente. Estas reacciones son ilustrativas del caso, no universales ni predicciones clínicas. La simulación se pausa manualmente y al ocultar la pestaña. Respeta el ajuste de movimiento reducido del sistema y ofrece reducción manual. Si WebGL falla, conserva la entrevista y las observaciones textuales.

Desde la versión 02 se pueden escribir preguntas, respuestas y acciones libremente. La versión 04 elimina las categorías superiores y las conserva solo para agrupar las herramientas opcionales. Un motor local interpreta intenciones dentro de este caso con reglas explícitas, variantes de frases y memoria de la relación. Las herramientas predefinidas quedan como ayudas opcionales. El guion local no usa servicios de IA. Desde la versión 05 se puede elegir Gemini para la conversación, mediante una ruta autenticada. No se añadió micrófono ni persistencia en base de datos. La comprensión está limitada: si no interpreta con suficiente certeza, solicita aclaración sin inventar hechos ni calificar la frase como un error. La lectura opcional usa la síntesis de voz del navegador, cuya disponibilidad y voces dependen del dispositivo. No hay animación facial, sincronización labial ni captura de movimiento. La interfaz presenta observaciones, no supuestas mediciones de confianza o ansiedad; los valores internos son variables ficticias del juego.

## Conversación y presencia · versión 03

La conversación principal usa mensajes de estudiante y paciente en columnas distintas, con las observaciones y los sucesos de la sala separados. No se muestran acotaciones entre corchetes dentro de lo que dice Valeria; la lectura de voz reproduce solo palabras del personaje. El registro completo y la devolución mantienen la cronología. No se modificaron los textos originales del historial para calcular la rúbrica.

Se puede escribir un mensaje o describir una acción, usar Enter para enviar y Mayús+Enter para añadir una línea. En práctica hay sugerencias que cargan borradores editables; no se envían automáticamente y no se muestran en evaluación. La respuesta tiene una breve transición visual. Pausar o reiniciar cancela una respuesta pendiente y conserva el borrador cuando se pausa. La conversación solo se desplaza automáticamente si el estudiante estaba viendo los mensajes recientes.

La marcha alterna con pausas, orientación hacia quien interviene y miradas hacia la puerta. Hay gestos de manos, rechazo y postura afectada. Si Valeria acepta una invitación a sentarse y no hay una urgencia médica pendiente, se acerca al asiento y se sienta; puede decidir levantarse después. La postura usa el mismo personaje y ajuste de extremidades, sin asignar mejoría emocional ni puntos por sentarse. La cámara adapta el encuadre. Con movimiento reducido se representa la postura mediante una vista estática. El modelo no contiene formas faciales animables: esta revisión amplía el lenguaje corporal, sin simular expresiones faciales ni sincronización labial.

## Interfaz y actuación corporal · versión 04

Solo hay dos paneles: Intervenir y Libreta. Intervenir conserva en un único chat mensajes, acciones e historial, con 510 px de altura en escritorio y 460 px en móvil. Se eliminó el panel duplicado de Conversación y las cuatro categorías superiores. Todas las herramientas siguen disponibles en grupos dentro del desplegable opcional, sin cambiar la rúbrica ni los requisitos de acciones reales.

La marcha es breve y recta, con giro previo y pausas; se eliminó la ruta elíptica. El enojo no provoca más marcha: activa una secuencia de límite, protesta asimétrica, retirada de manos y tensión sostenida. Hay posturas de protección y reserva, mano al rostro seguida de llanto con pausas y retorno al reposo durante la recuperación. Las manos tienen transiciones y los codos se orientan hacia abajo para reducir las poses artificiales. Se restablecen las rotaciones base antes de evaluar cada fotograma para impedir que los huesos sin pistas animadas conserven el ajuste del gesto anterior. La invitación a sentarse, la pausa y la reducción de movimiento se conservan.

Se revisaron opciones externas para modelos y animaciones faciales. La comparación, compatibilidad y propuesta de integración están en [pap-avatar-options.md](pap-avatar-options.md). No se instalaron bibliotecas ni activos externos nuevos; estas secuencias son propias y el rostro del modelo sigue estático.

## Conversación con Gemini · versión 05

Se reutiliza el conector de Gemini que usa el simulador de entrevistas y la autenticación existente. La interfaz permite elegir respuestas con Gemini o el guion local. La IA recibe el mensaje y un contexto acotado del caso; propone una intención y palabras de Valeria mediante JSON estructurado. El motor aplica los requisitos de acciones, consentimiento, urgencia médica, rechazo, reparación y cierre. Los intercambios con consecuencias conservan respuestas del guion; los mensajes conversacionales pueden usar el texto generado. Cada mensaje identifica si procede de Gemini o del guion.

La API es `/api/ai/pap-turn`, con autenticación, límite por usuario, validación de entrada y salida, tiempo de espera y modelos de respaldo. Ante fallo se conserva el ejercicio con aviso de respuesta local. Pausar o reiniciar cancela la solicitud y descarta resultados tardíos; durante la espera se detiene el reloj del caso.

El prompt completo, la configuración, los límites y las pruebas están en [pap-gemini-prompt.md](pap-gemini-prompt.md). Gemini ya se configuró en el entorno privado local y se comprobaron dos turnos reales; se configuró la autenticación con el proyecto existente y se verificó desde el navegador un turno real del chat con la cuenta habitual autorizada por el usuario. Las pruebas automatizadas siguen utilizando respuestas controladas. No se modificaron claves ni configuración de los módulos médicos o psiquiátricos existentes.

## Aprendizaje

- Preparación y seguridad del entorno; observación sin diagnóstico por gestos.
- Presentación, consentimiento, distancia y límites de privacidad.
- Entrevista breve sobre necesidades actuales, seguridad personal y necesidades físicas.
- Escucha, validación, respeto al silencio y recursos propios.
- Ayuda práctica con aceptación, información comprobada y apoyo social elegido.
- Identificación de un cambio de situación y reevaluación.
- Solicitud de valoración médica y confirmación de recepción cuando corresponde.
- Plan acordado, continuidad, registro y devolución educativa descargable en JSON.

El cierre completo requiere apoyos y plan confirmados, y reevaluación después de los últimos cambios. Las acciones perjudiciales quedan registradas aun si se repara el vínculo. La puntuación corresponde a una rúbrica de práctica diseñada para el prototipo, no a una escala validada ni a una acreditación clínica. No depende de eliminar el malestar. La variante médica prioriza ayuda y entrega antes de continuar las acciones ordinarias.

Es posible terminar la práctica en cualquier momento y revisar omisiones, identificado como cierre incompleto cuando corresponde. Terminar el ejercicio no marca como resueltas las necesidades del paciente. Una oferta de llamada recoge consentimiento; solo la acción efectiva confirma el contacto.

Modos: práctica con tutor y explicación tras actuar; evaluación sin tutor ni explicación formativa hasta el cierre. Las condiciones de disponibilidad y el estado del cierre permanecen visibles en ambos modos. Las notas y la sesión viven en memoria de la página; se pierden al recargar. La reflexión personal se conserva al cambiar de panel y se incorpora a la descarga.

## Fundamentos y revisión docente

- OMS, War Trauma Foundation y World Vision International (2011), [Psychological first aid: Guide for field workers](https://www.who.int/publications/i/item/9789241548205).
- OMS (2013), [Psychological first aid: Facilitator’s manual for orienting field workers](https://www.who.int/publications/i/item/psychological-first-aid).

Se sigue observar, escuchar y conectar. Acompañar se presenta como un grupo de acciones de apoyo dentro del enfoque; no es una fase adicional oficial de la OMS ni una secuencia rígida aplicable a todas las personas.

Antes de una evaluación formal: revisar el guion, las consecuencias y la rúbrica con docentes de psicología; adaptar las rutas de derivación a la institución; validar accesibilidad con estudiantes. Este primer caso no representa todas las crisis ni permite evaluar en la práctica un riesgo suicida positivo, violencia activa, menores o alteraciones graves de conciencia.

## Verificación reproducible

```sh
node --test tests/psychologicalFirstAid.test.mjs tests/papConversation.test.mjs tests/papPresentation.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js components/psychological-first-aid src/lib/psychologicalFirstAid.ts src/lib/papConversation.ts app/psychological-first-aid/page.tsx tests/psychologicalFirstAid.test.mjs tests/papConversation.test.mjs tests/papPresentation.test.mjs scripts/test-pap-browser.cjs scripts/test-pap-conversation-browser.cjs scripts/test-pap-experience-browser.cjs
npm run build
```

Con el servidor local en el puerto 3100 y Playwright disponible:

```sh
PAP_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/test-pap-browser.cjs
PAP_BASE_URL="http://127.0.0.1:3100" PAP_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/test-pap-conversation-browser.cjs
PAP_BASE_URL="http://127.0.0.1:3100" PAP_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/test-pap-experience-browser.cjs
```

`PAP_BASE_URL` permite cambiar la URL y `PAP_PLAYWRIGHT_MODULE` permite usar un módulo de Playwright instalado fuera del proyecto. El script verifica marcha, pausa, ambos recorridos, libreta, descarga, modo evaluación, diseño móvil, movimiento reducido y guía.

## Archivos principales

Validación de la versión 04: 85 pruebas de lógica aprobadas, incluida la secuencia acotada de protesta y la ausencia de marcha durante la agitación; TypeScript, ESLint y compilación de producción correctos. Chrome comprobó los dos paneles, la ausencia de categorías superiores, el chat ampliado, la voz, el teclado, la cancelación al pausar, asiento, levantarse, secuencias de gestos, móvil y movimiento reducido. También se comprobaron el recorrido completo, la variante médica, la libreta y la descarga. Se inspeccionaron visualmente las posturas de protesta y recuperación tras corregir el restablecimiento de huesos; sin errores de ejecución en navegador.

La versión 03 añade pruebas de separación de palabras y acotaciones, lectura de voz, postura elegida, pausas de movimiento y consentimiento. Validación del 22 de octubre de 2026: 83 pruebas de lógica aprobadas, TypeScript y ESLint sin errores y compilación de producción correcta. Sobre la versión compilada, Chrome comprobó mensajes, sugerencias editables, teclado, cancelación al pausar, asiento, levantarse, vista móvil de 390 px y movimiento reducido, además de ambos recorridos originales y la variante médica, sin errores de ejecución.

Validación de la versión 02: 78 pruebas de lógica aprobadas, incluidas 12 sobre conversación y gestos además de las 9 originales de PAP. Las pruebas de navegador verifican preguntas y acciones libres desde distintas categorías, agitación, retirada, rechazo a continuar, reparación gradual, interpretación incierta, consentimiento sin ejecución automática, pausa, conservación del borrador y cierre incompleto. Se comprobaron también ambos recorridos originales y la variante médica en la versión compilada. Los gestos se inspeccionaron visualmente en Chrome y se comprobó matemáticamente que el ajuste de brazos alcanza objetivos sin cambiar las longitudes de los segmentos.

Validación realizada el 21 de octubre de 2026: 66 pruebas de lógica aprobadas (9 nuevas de PAP), TypeScript y ESLint sin errores, compilación de producción correcta y ambos recorridos comprobados en Chrome sobre la versión compilada. Se verificaron escritorio, móvil de 390 px, marcha, pausa, modo evaluación, persistencia de la reflexión entre paneles, descarga, recepción médica y ausencia de errores de ejecución. Una comprobación adicional verificó continuidad de la entrevista ante fallo del modelo 3D y respeto al ajuste de movimiento reducido del sistema.

- `src/lib/psychologicalFirstAid.ts`: caso, respuestas, requisitos, cambios de situación y rúbrica.
- `src/lib/papPresentation.ts`: separación de palabras, observaciones y texto para lectura de voz.
- `components/psychological-first-aid/ConversationThread.tsx`: conversación y registro legibles.
- `src/lib/papConversation.ts`: interpretación local del texto libre, consentimiento, incertidumbre y memoria de interacción.
- `components/psychological-first-aid/FreeConversation.tsx`: entrada de preguntas y acciones propias.
- `components/psychological-first-aid/armIk.ts` y `bodyLanguage.ts`: gestos y objetivos de postura.
- `components/psychological-first-aid/PapSimulator.tsx`: interfaz y recorrido.
- `components/psychological-first-aid/PatientWorld.tsx`: escena, movimiento y ciclo de vida de WebGL.
- `public/psychological-first-aid/ATTRIBUTION.md`: procedencia y licencia del personaje.

El prototipo se prepara localmente. Publicarlo requiere trabajar desde un checkout real del repositorio; este directorio no contiene `.git`.
