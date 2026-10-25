# Laboratorio de cuidados básicos

Ruta: `/basic-care`. Acceso desde el catálogo de Enfermería y el dashboard.

16 casos adultos ficticios en cuatro estaciones: accesos periféricos, sonda nasogástrica, heridas y CVC. Cada caso tiene contexto, zona anatómica y recorrido propios. Dos modalidades: práctica con material destacado y evaluación sin material recomendado; ambas explican los errores con una recomendación. La puntuación conserva errores aunque se corrijan y solo es final al cerrar el caso. No equivale a una certificación de competencia.

Casos: antebrazo, mano, brazo superficial valorado, vía temporal existente en pierna, infiltración, flebitis; sonda estándar, tos/pH alto y contraindicación por trauma facial; incisión de 24 horas, infección y piel frágil; CVC yugular, apósito subclavio húmedo, sospecha de infección y colocación central asistida.

## Interacción

La vista inicial utiliza imágenes de apariencia fotográfica, generadas específicamente para este proyecto. La opción «Anatomía 3D» conserva la exploración geométrica. Recursos, procedencia y prompts: `public/basic-care/realistic/README.md`.

El material se prepara como una unidad concreta en `src/lib/careEquipment.ts`. Estados visibles: nuevo/disponible, seleccionado/en la mano, usado/pendiente de descarte, instalado y descartado. El selector de catéter exige confirmar 14, 16, 18, 20, 22 o 24 G antes de poder aplicarlo. El caso define su plan didáctico de calibre según la vena y la terapia descritas; no se trata de una recomendación universal por edad o región.

El catéter flexible pasa a instalado y conserva calibre y ubicación en el inventario. Su mandril se crea como un objeto usado separado y el siguiente paso exige desecharlo; también puede hacerse con el botón visible «Descartar mandril». Desechar el mandril no elimina el acceso instalado. Las gasas y otras unidades consumidas no pueden seleccionarse para otro uso; tomar otra prepara una unidad nueva. Los dispositivos ya existentes se cargan como instalados al iniciar su caso. Al retirar un apósito, su unidad pasa a usada. El cierre explícito incluye los residuos pendientes, mientras los dispositivos indicados permanecen instalados.

El panel formula una pregunta concreta sobre el paso actual, como «¿Qué zona es adecuada para valorar el acceso de este caso?». La pregunta aparece antes de la bandeja para no quedar oculta bajo los materiales. Elegir una respuesta o seleccionar una imagen no realiza la intervención. La práctica destaca el material y permite abrir toda la bandeja; la evaluación presenta la bandeja completa sin destacar la respuesta.

Un error abre un diálogo nativo con tres elementos: qué ocurrió, por qué no corresponde ahora y qué hacer en su lugar. El diálogo bloquea la interacción de fondo hasta cerrarse y evita acumular clics como errores sin leer la recomendación. La intervención errónea no se ejecuta y la bitácora conserva el motivo.

Cada material o acción tiene una imagen de apariencia fotográfica, su nombre y una explicación breve. La imagen seleccionada se puede ampliar en un diálogo nativo, que permite cerrar con Escape y mantiene el foco. Son recursos sintéticos orientativos, no fotografías de un fabricante.

Se puede pulsar Aplicar, pulsar una zona o arrastrar hasta un marcador sobre la imagen. El marcador anatómico se proyecta desde la escena 3D para acompañar el giro y el zoom. También hay zonas de preparación de manos, bandeja, valoración del paciente y punzantes. Todas las rutas usan el mismo motor de validación. Los botones permiten teclado y selección táctil; el arrastre táctil usa Pointer Events con una imagen flotante del material y validación del destino al soltar.

En celular, la vista del paso mantiene una escena compacta visible al desplazarse para poder arrastrar. La pestaña de paciente permite explorar la vista ampliada sin perder el estado. La secuencia bajo la imagen distingue tareas completadas y tarea actual; no marca como realizadas las acciones erróneas ni los pasos saltados. Los modelos de mano, antebrazo, brazo, pierna y tórax son diferentes.

El ángulo y el avance se ajustan con controles de rango. Cada pasada de limpieza requiere seleccionar otra gasa. La pausa bloquea intervenciones y respuesta a incidentes. Reiniciar o cambiar estación inicia una práctica nueva; no se guarda en el servidor.

Los modelos son geometría original en Three.js. La representación es esquemática y no reproduce tacto, resistencias, anatomía individual o destreza manual. Las animaciones ilustran la aplicación y los resultados; se respeta `prefers-reduced-motion` y existe un control de movimiento. Si WebGL no está disponible se conservan las acciones y la bitácora, sin la vista 3D.

## Variantes de seguridad

- Vía: ardor y edema durante comprobación. No mejora por leer el aviso; se exige detener el uso, retirar el acceso del caso no vesicante, valorar y notificar. Cierra como detenido. El manejo de extravasación de vesicantes queda fuera del caso y puede exigir conservar inicialmente el dispositivo según protocolo.
- Sonda estándar: sin tiras de pH disponibles, la tarjeta «Confirmación de la sonda» representa la revisión de una radiografía con interpretación documentada por personal competente. La auscultación con estetoscopio y la ausencia de tos no confirman la posición. No se enseña la auscultación de aire como autorización para usar la sonda. No se afirma que esta disponibilidad de materiales represente a todas las instituciones de Ecuador.
- Sonda con incidente: tos durante el avance; exige retirar y reevaluar, volver a posicionar y repetir la técnica. Después, pH 6,5 exige radiografía e interpretación documentada simulada antes de fijar. No se acepta auscultación como confirmación. La medida de 55 cm es propia del maniquí del caso y no es un valor universal. No se administra alimentación ni medicación en este módulo.
- Herida: exudado purulento, eritema en expansión y dolor creciente. Exige detener la rutina y solicitar valoración; no se declara curada la infección.
- Pierna: se valora un acceso adulto existente de emergencia y se coordina su sustitución por uno superior tan pronto sea posible. No hay un paso de nueva punción de pierna ni de lavado forzado.
- Flebitis: el acceso existente se deja de usar y se valora/retira según protocolo; no se fuerza un lavado.
- Trauma facial: se evita la sonda nasal y se solicita valoración para una alternativa segura.
- CVC: cuidados de un dispositivo existente y cambio precoz de un apósito húmedo/despegado. Secreción con escalofríos exige valoración inmediata; no se retira a ciegas ni se declara curado.
- Colocación central asistida: barreras máximas, colaboración con operador competente y ecografía, entrega del equipo y confirmación documentada de posición y ausencia de complicaciones antes de uso. No se presenta como una punción periférica ni como entrenamiento validado de maniobras profundas.

## Fuentes clínicas

- CDC: https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infection/prevention-strategies.html
- CDC, selección de sitios y cuidados periféricos/centrales: https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infections/summary-recommendations.html
- NHS England: https://www.england.nhs.uk/patient-safety/patient-safety-insight/patient-safety-alerts/enduring-standards/standards-that-remain-valid/medical-device-safety/
- NICE NG125: https://www.nice.org.uk/guidance/ng125/chapter/recommendations

Estos principios se adaptaron a escenarios simplificados. Se debe seguir el protocolo institucional y entrenar con supervisión. El resultado radiológico de la variante es un resultado narrativo simulado, no un ejercicio validado de interpretación radiológica.

## Repositorio reutilizado y licencia

Se reutiliza la dependencia existente `three` (sin añadir paquetes): https://github.com/mrdoob/three.js — MIT. Licencia y aviso de copyright: `node_modules/three/LICENSE` y https://github.com/mrdoob/three.js/blob/dev/LICENSE. No se copiaron modelos, animaciones ni recursos de otros simuladores clínicos.

## Verificación

`node --test tests/basicCareSimulation.test.mjs tests/simulationCatalog.test.mjs`

`node scripts/test-basic-care-browser.cjs` (requiere Playwright, `CARE_PLAYWRIGHT_MODULE`, `CARE_CHROME_PATH` y servidor en `CARE_BASE_URL`, predeterminado `http://127.0.0.1:3100`).

`node scripts/test-basic-care-ux-browser.cjs` comprueba reconocimiento visual, bandeja contextual y completa, ampliación con Escape, aplicación explícita, navegación móvil y controles por teclado.

`node scripts/test-basic-care-expanded-browser.cjs` recorre los 16 casos, comprueba el diálogo correctivo, arrastra materiales sobre los marcadores de la imagen y usa eventos táctiles reales del navegador para verificar el arrastre móvil.

`node --test tests/careEquipment.test.mjs` comprueba identidad de unidades, seis calibres válidos, ausencia de uso antes de confirmar, bloqueo de reutilización y separación entre catéter flexible y mandril.

`node scripts/test-basic-care-realistic-browser.cjs` comprueba la vista fotográfica, selección/confirmación de calibre, recomendación ante calibre inapropiado para el caso, colocación, descarte explícito del mandril, inventario al terminar, reinicio y arrastre táctil de un catéter 22 G preparado.
