# Cuidados críticos: práctica libre con evolución continua

Ruta: `/critical-care`. Se incorpora al menú de simulación, al catálogo del dashboard y a Escenarios y urgencias. El simulador dinámico por etapas y la sala clínica original se conservan.

## Casos

1. Neumonía con ventilación invasiva: ventilador, circuito, secreciones, sedación y tratamiento causal.
2. Evaluación inicial de ACV: FAST, glucemia, TC, hora de inicio y objetivos hemodinámicos con equipo especializado.
3. Crisis asmática grave: broncodilatadores, coadyuvantes, gasometría, flujo espiratorio y taquicardia por exposición repetida.
4. Sepsis con hipoperfusión: lactato seriado, cultivos, líquidos, antimicrobiano y vasopresor monitorizado.
5. Anafilaxia: vía aérea, soporte, adrenalina y diferencia entre tratamiento inicial y coadyuvantes cutáneos.
6. Hipoglucemia con alteración de conciencia: glucemia seriada, dextrosa o glucagón, seguridad de deglución y recurrencia.

## Motor y límites didácticos

Un único reducer gobierna el reloj, signos, farmacodinámica, muestras y complicaciones. Los cambios son graduales. Cada medicamento tiene latencia, duración, intervalo de reevaluación y límite de exposiciones del ejercicio. Se acumulan exposiciones activas y pueden activarse efectos adversos deterministas. Las infusiones de sedante y noradrenalina pueden detenerse; el efecto cede gradualmente. Los bolos ya administrados no se pueden deshacer.

Los tiempos de fármacos y estudios están acelerados y no representan farmacocinética ni demoras asistenciales reales. Las pautas no especifican dosis clínicas. El caso de ACV requiere resultado de TC y revisión de objetivos con el equipo antes de habilitar el antihipertensivo; no selecciona ni administra reperfusión automáticamente. La gasometría es sintética y no utiliza una equivalencia clínica entre EtCO₂ y PaCO₂.

Los exámenes guardan una copia del estado al solicitarse y conservan ese resultado. Tras recibirlo puede tomarse otra muestra, para comparar los valores antes y después del tratamiento. El cultivo muestra recepción de muestra, sin inventar una identificación microbiológica inmediata. Explorar no trata al paciente y las reevaluaciones muestran signos actuales junto a los hallazgos iniciales.

Las alertas registran inicio, revisión y resolución del criterio. Revisar una alerta no modifica la fisiología. Pausar o finalizar congela reloj, fármacos, muestras y complicaciones. La sesión queda en memoria de la página; el registro se descarga como texto, no se mezcla con historias ni notas de pacientes reales.

El paciente es una imagen fotorrealista generada, compartida entre casos ficticios; las señales visuales de respiración y equipo son ilustrativas. No certifica competencia ni funciona como herramienta asistencial.

## Referencias de contenido

- [GINA, informes y guías](https://ginasthma.org/reports/).
- [SCCM, Surviving Sepsis Campaign para adultos](https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines).
- [Resuscitation Council UK, anafilaxia](https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment-anaphylactic-reactions).
- [American Diabetes Association, hipoglucemia](https://diabetes.org/living-with-diabetes/hypoglycemia-low-blood-glucose).
- [American Stroke Association, signos de ACV](https://www.stroke.org/en/about-stroke/stroke-symptoms).

## Verificación

```sh
node --test scripts/test-critical-care.mjs
npx tsc --noEmit
npx eslint components/critical-care src/lib/criticalCareSimulation.ts src/lib/criticalCareCatalog.ts app/critical-care scripts/test-critical-care.mjs
npm run build
```

Pruebas del motor: seis casos, congelación en pausa, cuatro zonas, latencia y duración, repetición con bloqueo, complicaciones y revisión, sepsis, interrupción de infusiones, anafilaxia, muestras seriadas de glucemia, seguridad de ACV, ventilador y reinicio. La revisión en Chrome cubre las seis selecciones, respuesta farmacológica y alerta adversa, dos muestras capilares, recuperación de conciencia, ausencia de desbordamiento móvil, resumen y descarga.

## Imagen generada

Herramienta integrada: `image_gen` (sin CLI). Archivo final: `public/critical-care/patient-adult.webp` (1024 × 1536). Se mantiene como recurso del proyecto y se optimiza con `next/image`.

Prompt:

> Photorealistic natural documentary hospital photograph for a fictional adult clinical patient simulator. Portrait 2:3 composition, strictly centered full-body straight overhead view of a fictional Latino man around 55 years old lying supine on a real emergency hospital bed, eyes open, slightly pale, tired and worried, short dark hair with slight gray, realistic facial features and skin texture. Head at top face around 13 percent image height, shoulders at25 percent, chest at34 percent, pelvis at53 percent, knees70 percent and feet90 percent. Arms resting straight by sides, legs straight parallel with a little separation. Modest short-sleeved blue-gray hospital gown covers torso and pelvis down to upper thighs, visible bare lower legs, no nudity. White pillow and sheets, bedrails and real softly blurred hospital equipment on either side. No blanket over legs. No oxygen mask, no cannula or endotracheal tube because software will add equipment conditionally. A blood pressure cuff on upper arm is fine. Absolutely photographic realistic adult person, no cartoon, no CGI, no illustration, no mannequin. Neutral soft hospital lighting, detailed cotton texture, slight cool tones, no blood, no injuries, no text, numbers, labels, logos or watermark. Full body must be visible within frame including feet.

## Interacción guiada

La pantalla inicia con el caso seleccionado, un objetivo y cuatro acciones explicadas: explorar, decidir, observar y reevaluar. La biblioteca se abre al pulsar Cambiar caso. La guía de siguiente paso está activa por defecto y puede desactivarse sin limitar las herramientas disponibles.

`criticalCareGuidance.ts` usa las prioridades y requisitos ya definidos en el caso. Dirige a la acción exacta, resuelve accesos o pruebas previas y prioriza una complicación activa no leída. Los enlaces de orientación navegan; no administran medicamentos ni ejecutan cuidados sin pulsar su botón explícito. La guía puede explorar una zona cuando el botón dice Explorar.

La medicación tiene preparación, cancelación y confirmación explícitas. Preparar no cambia la fisiología. Tras un cuidado, un fármaco o un ajuste, la comparación conserva una copia de los signos previos y muestra los actuales. Es una asociación temporal, no una atribución causal exclusiva. Registrar reevaluación conserva otra copia y un evento, sin tratar al paciente.

Pruebas rápidas, laboratorio e imagen están en una sola pestaña, con agrupación y estados Sin solicitar / En proceso / Resultado disponible. Leer resultado es una acción independiente y está disponible en pausa. Las muestras antiguas permanecen fijas. Hay aviso de resultados sin leer y enlaces directos a los requisitos bloqueados.

Los controles se presentan junto al paciente; el monitor completo se despliega a demanda. La franja de signos incluye accesos a paciente y herramientas, y las pestañas admiten flechas, Inicio y Fin por teclado. La sala obstétrica conserva su motor y su imagen; añade orientación, comparaciones antes/ahora y explicación con acceso a consentimiento cuando se pulsa el punto 04 sin haberlo solicitado. Sus cuatro etapas de recorrido abren el panel correspondiente.

## Sala inmersiva, preparación y mediciones

La ruta `/critical-care` comienza en una biblioteca de seis tarjetas con resumen. Al seleccionar un caso se abre una ficha con edad, peso, talla, IMC calculado, contexto, objetivo y duración de 10, 20 o 30 minutos. Los datos antropométricos son ficticios y no determinan dosis; el peso predicho ventilatorio continúa definido por el caso.

Al iniciar se oculta la navegación general y la sala ocupa la ventana: monitor a la izquierda, paciente central y panel de herramientas a la derecha, con desplazamiento interno. La barra inferior abre Diálogos, Examen físico, Monitorizar, Pruebas, Llamar, Intervención, Medicación, Historia clínica y Registro; Ventilador aparece en el caso correspondiente. La búsqueda filtra opciones existentes, sin generar tratamientos ni resultados.

El equipo está siempre visible y comienza con lecturas en blanco. Cada canal (ECG/FC, PA, SpO₂, FR, temperatura y EtCO₂) se conecta desde Monitorizar. `state.monitoring` guarda el instante de conexión y se borra al desconectar o reiniciar. Los valores proceden directamente del motor existente: activar un sensor no mejora la fisiología, desconectarlo no detiene la evolución, y al reconectar se muestra el estado actual. Las ondas son ilustrativas, con ritmo ligado al mismo estado fisiológico.

Las comparaciones antes/después no muestran valores previos si ese sensor no estaba conectado cuando se registró la decisión. Glucemia y otros análisis siguen siendo resultados de muestras con tiempo de espera; no se presentan como canales continuos. Pausar detiene fisiología, medicación, muestras y animación; cambiar de panel no pausa. El botón de audio es una prueba puntual, no una alarma cardíaca continua.

`PatientStage.tsx` contiene una ilustración SVG original con respiración según FR, parpadeo y movimientos leves; la conciencia modifica la apertura ocular y el compromiso circulatorio modifica el tono ilustrativo. Los electrodos y los equipos aparecen al conectarse o intervenir. Permite cambiar a la fotografía sintética existente, acercar la vista y ocultar puntos. No es un modelo 3D ni una representación validada de signos clínicos. La preferencia de movimiento reducido detiene las animaciones.

Se revisó [MPFB/MakeHuman](https://github.com/makehumancommunity/mpfb2) como opción para personajes 3D. Sus [recursos gráficos principales son CC0](https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md); el código del generador es GPLv3. No se incorporó código ni modelos externos. Una integración futura requeriría exportar un personaje vestido y con rig, preparar postura supina y animaciones respiratorias, reducir polígonos/texturas y verificar el rendimiento web. Los recursos de terceros o paquetes comunitarios deben revisarse por separado.

## Ampliación educativa de octubre de 2026

La vista predeterminada usa ahora `patient-realistic-v2.jpg`; la ilustración sigue disponible. El catálogo ampliado, las presentaciones, las preguntas durante y al finalizar el caso, las referencias MSP y sus límites se describen en [clinical-education.md](clinical-education.md). Esta actualización también incluye la sala ginecológica y una imagen sintética nueva para la paciente.

El cierre abre ahora un resumen emergente con resultado, registro y navegación para repetir o elegir otro caso. La preparación ofrece niveles Guiada, Autónoma y Desafío, con puntos de exploración configurables también en la fotografía. Véase [clinical-education.md](clinical-education.md).
