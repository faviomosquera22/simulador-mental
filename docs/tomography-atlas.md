# Atlas de tomografía 3D

Ruta: `/tomography-simulator`. Accesible desde los catálogos de Enfermería y Medicina y desde Imágenes clínicas.

## Funciones

- Ocho encuadres reales: cuerpo completo, cabeza, cuello, tórax, abdomen, pelvis, extremidades superiores junto al tronco y extremidades inferiores.
- Reconstrucción axial/transversal, coronal, sagital, multiplanar con 3D y volumen 3D rotatorio.
- Barra por eje, avance y retroceso, reproducción a 3/6/12 cortes por segundo y pausa al ocultar la pestaña.
- Ventanas para tejidos, pulmón, hueso, cerebro y rango amplio; ancho/nivel; zoom, desplazamiento y medición aproximada.
- Volumen 3D con mapas por densidad, transparencia y plano de recorte. Captura PNG y pantalla completa cuando el navegador lo permite.
- Importación NIfTI local de hasta 100 MB. No se sube el archivo a ningún servidor. Las regiones predefinidas se desactivan como contexto del archivo local.
- Referencias radiológicas y lectura de densidad/posición del punto seleccionado.

Los colores del volumen son funciones de transferencia por densidad, **no segmentaciones de órganos**. Las estructuras de la guía son objetivos de exploración. La opción Nombres anatómicos añade etiquetas ligadas a las máscaras del atlas, además de las referencias óseas descritas más abajo. La vista combinada conserva escala de grises; los aspectos coloreados abren la vista de volumen 3D.

## Motor abierto reutilizado

[NiiVue](https://github.com/niivue/niivue), paquete `@niivue/niivue` 0.69.0, licencia BSD de dos cláusulas. La licencia se conserva en `public/tomography/NIIVUE-LICENSE.txt`. Importación dinámica en el navegador; se requiere WebGL 2. No requiere un servicio externo de imágenes para utilizar el atlas incluido.

## Procedencia de las imágenes

**Courtesy of the U.S. National Library of Medicine**.

[Visible Human Project](https://www.nlm.nih.gov/research/visible/visible_human.html), espécimen masculino, adquisición CT congelada. [Directorio fuente](https://data.lhncbc.nlm.nih.gov/public/Visible-Human/Male-Images/radiological/frozenCT/). Se aplican los [términos de NLM](https://www.nlm.nih.gov/databases/download/terms_and_conditions.html); no se implica respaldo de NLM. Esta adaptación remuestreada no refleja necesariamente los datos más actuales ni la máxima exactitud disponible en NLM.

Es una sola adquisición post mortem, no una colección de casos clínicos vivos ni una prueba de normalidad anatómica. No se ha validado su exactitud clínica. Pueden observarse artefactos de congelación, soporte, adquisición y cambios entre series.

## Preparación reproducible

`scripts/prepare-tomography.py` requiere Python, NumPy, Pillow, curl y Unix uncompress. Caché fuera del repositorio, en `/tmp/psyke-visible-human-frozen`. Descarga un corte de cada tres del conjunto fuente (626 cortes), interpreta los píxeles GE de 16 bits con el desplazamiento de intensidad de su encabezado y elimina todos los encabezados originales en la salida.

Las esquinas R/A y el tamaño del píxel de GE definen el registro en el plano. Para la posición longitudinal se usa el número del archivo que corresponde a la posición de la criosección: `Z = 2882 - número`, en milímetros. **No se utiliza la posición Z del escáner para unir series**, porque se reinicia con los cambios de mesa. Este problema está documentado por [Imaging Data Commons](https://github.com/ImagingDataCommons/NLM-Visible-Human-Project-DICOM-Conversion). No se mezclan cortes del estudio normal y del congelado.

El volumen se remuestrea con interpolación bilineal en el plano y lineal longitudinal, en una rejilla RAS de 2,5 × 2,5 × 3 mm (225 × 225 × 626), aproximadamente 20 MB comprimido. Los encuadres regionales son recortes del mismo volumen. Una separación de fuente mayor de 15 mm se dejaría vacía y se registraría en el manifiesto; la preparación incluida no presenta esos huecos. Las reconstrucciones regionales no añaden resolución.

`public/tomography/manifest.json` conserva dimensiones, origen, espaciado, posiciones de cortes, procedencia y SHA-256 de cada volumen. Los valores y mediciones son aproximados por el remuestreo y la naturaleza del espécimen. No sustituye a un visor diagnóstico certificado ni a una revisión radiológica.

## Verificación

- Pruebas `tests/tomography.test.mjs`: integridad NIfTI y hash, escala de intensidad, dimensiones/espaciado, cobertura longitudinal, límites de navegación, planos y descubrimiento en los catálogos.
- Script de navegador: `scripts/test-tomography-browser.cjs`.
- Compilación: `npm run build`.

La publicación requiere un checkout Git conectado al repositorio del proyecto.

Validación local completada: compilación de producción correcta; 9 pruebas de integridad/geometría/navegación y catálogo correctas; prueba en Chrome con WebGL para las ocho regiones, diferencias visuales de ventanas/opacidad/recorte, reproducción, rotación, captura PNG, importación local, error de archivo, fallo HTTP y reintento, control táctil y catálogo. Las capturas revisadas se guardan en `output/tomography/`.


## Nombres anatómicos por corte y en 3D

Se añadieron filtros independientes **Huesos, Órganos, Vasos y Músculos**, activación general, límite de rótulos, lista contextual con búsqueda sin tildes, localización al pulsar una estructura e identificación de la etiqueta bajo el cursor. Los nombres cambian según el plano y el corte. Los puntos y líneas se reproyectan al mover, ampliar o rotar el visor. Las capturas PNG incluyen los rótulos.

El catálogo contiene 211 clases con presencia en el volumen; 195 pertenecen a los cuatro grupos activables. Huesos incluye discos y cartílagos de las articulaciones. Las demás clases de tejidos sin clasificación específica no se muestran por defecto. Los rótulos visibles se limitan para evitar superposición; la lista conserva todas las estructuras anotadas que corresponden a los cortes visibles. En 3D sin recorte, las referencias pueden señalar estructuras internas ocultas por la superficie o por la ventana elegida; se indica en el panel.

### Fuente anatómica y atribución

**Karl Heinz Höhne, Bernhard Pflesser, Andreas Pommert, Martin Riemer, Thomas Schiemann, Rainer Schubert, Udo Schumacher y Ulf Tiede. Segmented Internal Organs of the Visible Human Male (VOXEL-MAN SIO), 2025.** [DOI 10.5281/zenodo.15882019](https://doi.org/10.5281/zenodo.15882019). Licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cambios: traducción del catálogo al español, agrupación, remuestreo de máscaras y registro sobre la tomografía existente.

El SIO corresponde al mismo espécimen Visible Human Male e incluye el tronco, pelvis y parte del cuello y extremidades superiores (cortes fuente 1256–2029). No proporciona segmentación de la cabeza completa ni de las piernas completas.

`scripts/prepare-tomography-anatomy.py` usa los TIFF de CT y etiquetas emparejados del archivo fuente y registra cada plano sobre la CT original, sin modificar sus intensidades. Se corrige la orientación de ambas imágenes de origen juntas; se calcula una transformación afín 2D mediante ECC y se remuestrean las etiquetas con vecino más próximo. Se aceptaron 256 de 258 planos; dos se excluyeron por el criterio técnico de registro. La correlación de intensidades sirve para excluir ajustes deficientes y **no constituye una validación clínica de la segmentación ni del registro**.

Se agregan referencias óseas orientativas por umbral y componentes conexos en regiones conservadoras del cráneo, fémur, tibia, peroné y huesos del pie. Se identifican como `source: morphology`, separadas de las segmentaciones registradas `source: sio`. No se atribuyen a VOXEL-MAN, no segmentan cada hueso craneal o del pie y no se muestran nombres donde no existe una anotación disponible. Se evita etiquetar la rodilla por esta vía debido al material de soporte visible en la CT.

### Archivos y verificación

- `public/tomography/anatomy.json`: catálogo en español, procedencia, métricas de registro, anclas para cada plano y puntos 3D.
- `public/tomography/anatomy-labels.nii.gz`: etiquetas categóricas de 8 bits en exactamente la misma rejilla y afín de la CT de cuerpo completo; no se añade como volumen visible al motor GPU.
- Cada ancla se elige entre los vóxeles de su propia clase. No se utiliza el centro de una caja ni un centroide que pueda caer fuera del órgano.
- La cobertura se filtra por la región cargada y por las categorías activas. Las etiquetas se desactivan para archivos locales del usuario.
- `tests/tomographyAnatomy.test.mjs`: comprueba todos los puntos 2D, puntos 3D, afín, hash, lateralidad, correspondencia de clase, límites de cobertura, planos rechazados y filtros.
- `scripts/test-tomography-anatomy-browser.cjs`: prueba filtros, cambio de corte/plano, identificación, búsqueda/localización, seguimiento de la cámara, PNG anotado, aislamiento de archivos propios e interacción móvil.

Validación de la incorporación anatómica: 14 pruebas de datos/navegación/catálogo correctas; ESLint de los archivos nuevos y modificados sin incidencias; compilación de producción correcta; prueba funcional completa en Chrome con punteros contrastados contra el volumen de etiquetas, filtros, identificación, movimiento por cortes, rotación, PNG con nombres, aislamiento de archivos propios y móvil/táctil. Capturas de revisión en `output/tomography/anatomy/`.
