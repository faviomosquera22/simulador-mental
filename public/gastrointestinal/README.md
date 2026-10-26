# Imágenes del caso gastrointestinal

Imágenes sintéticas generadas el 25 de octubre de 2026 con la herramienta integrada `image_gen`. Representan un adulto ficticio y equipos genéricos sin marca; no son fotografías de pacientes reales ni imágenes diagnósticas.

- `patient-v1.png` / `patient-v1.webp`: atlas horizontal de dos retratos del mismo adulto; izquierda, malestar inicial; derecha, mayor comodidad después del periodo observado. Cada retrato tiene proporción 3:4. La interfaz conserva su proporción y permite ampliarlo.
- `equipment-v1.png` / `equipment-v1.webp`: atlas 3×3: termómetro, tensiómetro, estetoscopio; SRO y agua, jarra graduada, recipiente de muestra; medicación genérica, teléfono, educación.
- Los prompts exactos están en [prompts.json](prompts.json). Se usó la herramienta integrada, sin CLI ni clave API en el proyecto.
- La conversión a WebP conserva la composición. Los recortes de las celdas se realizan con CSS.
- Se reutilizan las imágenes locales de pulsera, higiene, guantes, valoración y catéter de `public/basic-care/realistic/`; su procedencia está documentada allí.

La imagen no identifica un microorganismo ni permite establecer gravedad. Las cifras, hallazgos y cambios son datos didácticos del caso. Un cambio de expresión ilustra comodidad; no demuestra curación.
