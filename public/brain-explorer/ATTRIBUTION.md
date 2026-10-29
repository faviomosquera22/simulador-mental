# Cerebro 3D: procedencia y limitaciones

Superficies corticales ICBM152: BrainMesh_ICBM152.lh.mz3 y BrainMesh_ICBM152.rh.mz3, distribuidas por Surf Ice / BrainNet:
https://github.com/neurolabusc/surf-ice/tree/master/BrainNet
Descargadas el 29 de octubre de 2026. Ambas tienen 40.962 vértices y 81.920 triángulos. Esta plantilla es simétrica: los vértices del hemisferio derecho corresponden al reflejo del izquierdo en la distribución original. No se representan asimetrías individuales.

Convertidas conservando coordenadas y topología a cortex-left.bin y cortex-right.bin: cabecera uint32 (vértices, caras), coordenadas float32 MNI, índices uint32, sombreado float32 por vértice; little-endian. El sombreado de surcos se calcula mediante curvatura local, sin mediciones funcionales. Conversor reproducible: scripts/prepare-brain-surfaces.py.

La versión inicial cortex.bin se conserva para trazabilidad, pero el visor carga las dos superficies anteriores. Se omiten cerebelo y tronco. Las formas internas (amígdala, hipocampo y territorio de estriado ventral) son aproximaciones geométricas educativas. Las áreas corticales coloreadas son selecciones elipsoidales aproximadas, no parcelas de un atlas funcional ni segmentaciones. Separar hemisferios es un recurso de exploración, no una distancia anatómica. Las líneas y partículas representan interacciones de forma esquemática: no tractografía, dirección de conducción, latencia, frecuencia ni medidas eléctricas. Los colores identifican estructuras, no gravedad ni mayor o menor actividad.

Surf Ice: Copyright (c) 2016–2020 Chris Rorden. BSD 2-Clause: ver LICENSE-SURFICE.txt.
NiiVue:
https://github.com/niivue/niivue/blob/main/packages/niivue/demos/images/BrainMesh_ICBM152.lh.mz3
Descargada el 29 de octubre de 2026. Convertida sin alterar coordenadas ni topología a cortex.bin (cabecera uint32 número de vértices y caras, coordenadas float32, índices uint32, little-endian).

El hemisferio derecho se obtiene reflejando el izquierdo en el visor. No representa asimetrías reales. No incluye cerebelo ni tronco. Los nodos internos son marcadores esquemáticos de ubicación aproximada MNI, no segmentaciones anatómicas. Las líneas muestran relaciones educativas seleccionadas y no tractografía. Los colores y pulsos no representan medidas eléctricas, fMRI, EEG ni biomarcadores diagnósticos.

NiiVue: Copyright (c) 2021 Niivue. BSD 2-Clause: ver LICENSE-NIIVUE.txt.
Fuente anatómica ICBM152 / MNI: Copyright (C) 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University.
Permission to use, copy, modify, and distribute this software and its documentation for any purpose and without fee is hereby granted, provided that the above copyright notice appear in all copies. The authors and McGill University make no representations about the suitability of this software for any purpose. It is provided "as is" without express or implied warranty.

Los ambientes sonoros se generan localmente con Web Audio. No contienen grabaciones de pacientes ni audio externo. Son interpretaciones narrativas opcionales, no una reproducción universal de una patología. No se transmiten datos del estudiante o del caso.

## Audio de la experiencia
Las nueve pistas estéreo de 12 segundos se generan con síntesis numérica local (lluvia, notas, latidos, respiración, reloj y ambiente de ascensor). El texto de cada momento del caso se convierte en una voz española sintetizada mediante las voces del sistema macOS. Son dramatizaciones de personajes ficticios; el texto completo permanece visible. Se generan con scripts/prepare-brain-audio.py. No hay grabaciones de pacientes ni muestras de terceros. La voz se puede desactivar independientemente del ambiente. Las pistas comienzan por una acción del usuario y se detienen con Desactivar sonido, Escape, al cambiar de caso, al ocultar la pestaña y al abandonar el módulo.
