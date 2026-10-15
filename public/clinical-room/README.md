# Recursos de paciente simulado

Imágenes sintéticas creadas con la herramienta integrada ImageGen. No representan pacientes reales. Se usan con `next/image`, por lo que la aplicación puede optimizar su entrega. La interfaz muestra el origen sintético.

- `patient-baseline.png`: escena inicial, 1024 × 1536.
- `patient-oxygen.png`: variante con mascarilla, misma paciente y encuadre.

El acceso venoso es una capa SVG independiente para poder activarlo sin simular otras intervenciones. Los puntos de exploración son botones accesibles. Las cuatro zonas se registran al explorarse; la exploración pélvica exige consentimiento.

## Prompts finales

Herramienta: `image_gen.imagegen` integrada, modo generate para la base y edit para oxígeno; no se usó la CLI.

### Base

Create one photorealistic clinical simulation background asset, portrait 1024x1536. A fictional adult Latina woman age 28 lying supine on a modern hospital emergency stretcher, camera from above and slightly foot-end looking toward her face, centered symmetrical composition showing head through shins. She has dark brown shoulder-length hair, natural skin texture, eyes open, mildly anxious pale expression, fully dressed in a muted sage green hospital gown covering chest and upper legs, modest white hospital sheet over lower legs and pelvis. Arms visible at sides, left forearm available for an IV, upper arm blood pressure cuff. Realistic professional medical training photography, cool charcoal teal hospital room, pillow, bed rails, subtle medical equipment in background, soft natural hospital ceiling lighting, accurate human anatomy, no blood, no injuries, no nudity, no words, no labels, no watermark, no graphic, no collage. Leave space beside her head and shoulders for interface overlays. Do not place an oxygen mask or intravenous line: those will be interactive overlays in the software. Image is for educational simulated emergency gynecology patient, not an actual patient. Refined cinematic but medically credible editorial photo quality.

### Estado con oxígeno

Edit this exact fictional clinical simulation photo to add a realistic transparent simple oxygen face mask over the woman's nose and mouth with thin elastic straps and connected clear oxygen tubing leading naturally off frame to her left (image right). Preserve her exact identity, face geometry, gaze, body pose, bed, hospital gown, hands, lighting, equipment, camera framing and original dimensions precisely. Change only the addition of oxygen mask, straps and tubing. No IV added. No text or labels. This second state will be crossfaded over the original in an interactive simulator, so all objects and positions must stay aligned.
