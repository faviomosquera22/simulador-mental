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
