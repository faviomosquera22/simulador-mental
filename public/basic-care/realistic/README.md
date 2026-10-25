# Recursos de apariencia fotográfica para el laboratorio virtual

Generados el 25 de octubre de 2026 con la herramienta integrada `image_gen`. Son imágenes sintéticas de personas ficticias y equipos sin marcas; no son fotografías clínicas de pacientes reales ni documentación de una técnica validada.

Los PNG originales y los WebP de entrega están guardados en esta carpeta. La conversión de formato conserva composición y dimensiones; el catéter instalado mantiene transparencia. Las versiones WebP reducen el peso de descarga para las clases virtuales.

| Archivo de entrega | Contenido |
| --- | --- |
| `forearm-v1.webp` | Antebrazo sin dispositivo, para practicar la colocación |
| `hand-v1.webp` | Dorso de la mano sin dispositivo |
| `chest-v1.webp` | CVC yugular ya instalado, para los casos que lo reciben así |
| `chest-before-v1.webp` | Mismo tórax sin dispositivo para preparar y visualizar cambios |
| `patient-scenes-v1.webp` | Atlas 2 × 2: brazo, pierna, paciente para sonda e incisión |
| `equipment-v1.webp` | Atlas 7 × 4 con seis calibres de catéter y 22 materiales/acciones |
| `installed-catheter-v1.webp` | Catéter flexible sin mandril, con transparencia, para representar el dispositivo retenido |

Los prompts exactos de generación están en [prompts.json](prompts.json); los de las dos ediciones/variantes finales están en [edit-prompts.json](edit-prompts.json). Los recortes del atlas se realizan en la interfaz con CSS, sin recortar destructivamente los originales.

Las imágenes se combinan con estados reales del simulador: tomar una unidad, usarla, mantener un dispositivo instalado y desechar el material utilizado. Los colores y los rótulos de calibre se muestran en la interfaz; la imagen orientativa no sustituye comprobar el envase del producto.

## Bibliotecas y alternativas revisadas

- [Three.js](https://github.com/mrdoob/three.js), MIT: dependencia existente para la vista anatómica opcional. La vista por defecto usa las imágenes de esta carpeta y capas interactivas.
- [Skills-Lab](https://github.com/StefanBauwens/skills-lab): simulador VR para Unity y HTC Vive revisado como referencia de interacción e inventario. No se copió su código ni sus modelos; requiere un entorno distinto del navegador de este proyecto.

## Fuentes para la selección de calibre

- [Australian Commission: Management of Peripheral Intravenous Catheters](https://www.safetyandquality.gov.au/clinical-care-standards/management-peripheral-intravenous-catheters).
- [BD: catálogo de soluciones de administración](https://www.bd.com/documents/international/catalogs/medication-delivery-solutions/MDS_Medication-Delivery-Solutions-Product-Catalogue_CT_EN.pdf).

Se ofrecen los calibres 14, 16, 18, 20, 22 y 24 G. Los intervalos aceptados por cada caso son decisiones didácticas del maniquí descrito; no son una regla universal por edad o zona anatómica. La elección clínica depende de la vena, terapia, duración, dispositivo y protocolo.
