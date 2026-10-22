# Expresividad de Valeria: opciones revisadas

Revisión: 22 de octubre de 2026. Estos repositorios se investigaron; no se instalaron ni se incorporaron sus modelos o animaciones al prototipo.

## Lo que permite el archivo actual

La inspección de `valeria.glb` encontró un esqueleto corporal y dos clips, reposo y marcha. No contiene morph targets faciales ni huesos de cejas, párpados o mandíbula. Instalar otra biblioteca no permite animar esas partes sin preparar o sustituir el modelo.

La versión 04 conserva el personaje adulto y añade secuencias corporales propias con transiciones: límite con una mano, protesta asimétrica, retirada de manos, tensión sostenida, postura de protección, mano al rostro seguida de llanto con pausas y escucha cautelosa. Los cruces breves y rectos sustituyen la ruta elíptica. La agitación ya no acelera la marcha. No se trata de captura de movimiento ni de expresiones faciales.

## Candidatos

| Proyecto | Aporte documentado | Trabajo necesario para este simulador |
| --- | --- | --- |
| [TalkingHead](https://github.com/met4citizen/TalkingHead) | JavaScript/Three.js; expresiones faciales, estados como enojo, tristeza y miedo, gestos y reproducción de animaciones. Código MIT. | Modelo GLB con esqueleto compatible con Mixamo y blendshapes ARKit/Oculus. El modelo actual no cumple estos requisitos. Revisar por separado la licencia del personaje elegido. La sincronización labial en español necesita una solución de voz/visemas compatible; no se obtiene de la lectura nativa actual. |
| [three-vrm](https://github.com/pixiv/three-vrm) | Manejo de personajes VRM en Three.js y de expresiones del modelo; código MIT. | Crear o adquirir un personaje adulto con apariencia adecuada y expresiones VRM. Rehacer la adaptación del esqueleto, silla y cámara, conservar el motor del caso y comprobar el resultado visual. |
| [Mesh2Motion](https://github.com/Mesh2Motion/mesh2motion-app) y [sus recursos](https://github.com/Mesh2Motion/mesh2motion-assets) | Importar modelos, ajustar esqueletos y exportar animaciones GLB/GLTF. Repositorio de arte CC0. | Seleccionar o producir actuaciones apropiadas, adaptar la animación al personaje y revisar pies, manos y transiciones. No aporta por sí solo expresiones faciales al GLB actual. |
| [FACSHuman para Python 3](https://github.com/montybot/FACSHuman-Py3-Enhanced) | Herramientas de MakeHuman para crear y animar acciones faciales. | Preparación de un personaje y sus expresiones fuera del navegador; comprobar exportación y licencias de los activos concretos antes de integrarlos. No es un reemplazo directo del componente web. |

La [biblioteca de Ready Player Me](https://github.com/readyplayerme/animation-library) tiene captura de movimiento y una categoría de expresiones, pero su documentación indica que está diseñada para sus propios personajes. No se propone copiar sus movimientos al modelo MakeHuman actual.

## Siguiente integración propuesta

Para una conversación con rostro expresivo, probar TalkingHead con un único personaje compatible antes de migrar la escena completa. Validar primero ceño, parpadeo, mirada, tristeza y protesta, sin depender de un servicio de voz. Conectar las expresiones a los estados existentes del caso; el motor sigue siendo responsable del consentimiento, el riesgo, la valoración, la reparación gradual y la rúbrica. Después incorporar clips corporales adaptados y comprobar continuidad entre posturas y silla.

Revisar con docentes las actuaciones y sus variaciones. El objetivo de diseño es representar angustia, enojo y límites de una persona, evitando convertir toda reacción adversa en una misma exageración. El rostro, el cuerpo y la respuesta verbal deben resultar coherentes; ninguna expresión aislada debe presentarse como diagnóstico ni como medida clínica.
