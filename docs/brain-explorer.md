# Cerebro 3D y redes emocionales

Ruta: `/brain-explorer`. Acceso desde Psicología, categoría Estudios e interpretación.

Tres casos ficticios (depresión, ansiedad generalizada y claustrofobia), cada uno con contexto, experiencia y apoyo inicial. El cambio de momento destaca redes de participación diferentes sin codificar gravedad ni simular mediciones. Seis regiones con selección por botones o nodos visibles, transparencias, vistas, giro/zoom con ratón y táctil, pausa y respeto de movimiento reducido. Sonidos sintetizados opcionales, volumen regulable, apagado al cambiar caso o ocultar la pestaña y suspensión al pausar. Pregunta y devolución independiente por caso.

Las superficies originales ICBM152 de ambos hemisferios se distribuyen como plantilla simétrica. Se añade sombreado de surcos. Formas internas esquemáticas y áreas corticales aproximadas sustituyen los marcadores esféricos. Etiquetas conectadas a las estructuras, selección directa en 3D, separación de hemisferios, recorrido por la red y explicación contextual por región, caso y momento. Nodos y conexiones esquemáticos. Ver `public/brain-explorer/ATTRIBUTION.md`. El visor no muestra un EEG ni un biomarcador, y no diagnostica. Audio narrativo, no experiencia universal. Requiere revisión docente antes de su uso curricular.

Validación: `node --test tests/brainExplorer.test.mjs tests/simulationCatalog.test.mjs`, TypeScript, ESLint en archivos nuevos y `next build --webpack`. Prueba de producción con Chrome: `node scripts/test-brain-explorer-browser.cjs` (permite BRAIN_PLAYWRIGHT para ubicación del runtime). Comprueba catálogo, carga anatómica, tres casos, momentos, región, sonido/pausa, pregunta/reset, vistas, móvil sin desbordamiento, ausencia de errores y alternativa sin WebGL. Capturas actualizadas en `/tmp/brain-v2-anatomy.png`, `/tmp/brain-v2-network.png`, `/tmp/brain-v2-preview.png` y `/tmp/brain-v2-mobile-final.png`.

La publicación integra el módulo y sus activos en el catálogo de Psicología, conservando el resto de los simuladores.

Actualización visual: se validan también el recorrido guiado, la selección por etiqueta y sobre una estructura 3D, la separación de hemisferios y explicaciones para las 54 combinaciones de caso/momento/región.

Audio actualizado: nueve pistas WAV estéreo de ambiente y nueve frases dramatizadas en español, con activación directa en el gesto del usuario, voz independiente, repetición, mezcla con atenuación del ambiente mientras habla el personaje, volumen inicial 55%, estado real de reproducción y parada con Escape. El control principal está encima del visor. Pruebas: tests/brainAudio.test.mjs y scripts/test-brain-audio-browser.cjs verifican contenido PCM, duración, archivos diferentes y reproducción nativa de ambos elementos, volumen, voz, pausa, momentos, caso y desmontaje.
