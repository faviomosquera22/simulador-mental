# Personaje humano para el prototipo PAP

`valeria.glb` combina las animaciones de reposo y marcha de Maya, personaje adulto ficticio de Innerscene, adaptado de recursos MakeHuman/MPFB CC0.

- Reposo: https://www.innerscene.com/tools/library/3d-parts/idle-standing-maya-3d-person-animated-22b686d6
- Marcha: https://www.innerscene.com/tools/library/3d-parts/relaxed-walk-maya-3d-person-animated-2c6669a2
- Licencia declarada por el proveedor para ambos archivos: **CC0 1.0**, https://creativecommons.org/publicdomain/zero/1.0/
- Descargados el 21 de octubre de 2026. Las páginas del proveedor y los metadatos del GLB identifican activos CC0 y movimiento original sin captura de movimiento.
- Cambios locales: combinación de clips con malla y texturas compartidas; texturas limitadas a 1024 px; nombre y contexto educativo ficticios. El personaje visual no representa a una paciente real.
- Preparación reproducible: `scripts/prepare-pap-model.py idle.glb walk.glb output.glb`, con Pillow.

Motor: Three.js, MIT, https://github.com/mrdoob/three.js. Las licencias de código y de modelos son independientes.

Las animaciones representan reposo y marcha. La orientación, ruta por la sala y pausa se controlan localmente; no hay captura facial, sincronización labial ni estimación clínica de emociones.
