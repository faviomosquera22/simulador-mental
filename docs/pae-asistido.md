# PAE asistido: búsqueda, selección y límites del catálogo

La interfaz `/pae-assistant` separa la edición por pasos, el resumen del plan y la vista del formato imprimible. El catálogo completo se puede consultar desde cada paso, aunque por defecto se muestran sugerencias. La búsqueda admite código, términos en distinto orden, acentos y palabras pegadas durante la importación.

## Fallos encontrados y corregidos

- La importación contiene 273 etiquetas NANDA, 619 NOC y 613 NIC. Todos los campos de características, factores, indicadores, actividades y relaciones NNN estaban vacíos. Algunos nombres contenían palabras pegadas o restos de referencias bibliográficas.
- Las sugerencias anteriores otorgaban puntos por contexto incluso sin coincidencias clínicas y rellenaban con los primeros registros cuando no había resultados. Se eliminó ese comportamiento.
- El formulario seleccionaba automáticamente un diagnóstico y resultados/intervenciones. Ahora requiere elecciones explícitas. Un cambio de NANDA limpia NOC, NIC, indicadores, actividades y fundamentación previa.
- Dominio/clase NOC y campo/clase NIC se inferían por palabras o rangos numéricos. Ahora los datos no documentados se señalan como tales en lugar de inventar una clasificación.
- Se añadieron reparaciones puntuales de etiquetas y guías educativas locales para orientar escenarios frecuentes. No constituyen las vinculaciones oficiales NANDA–NOC–NIC.
- Los valores iniciales de los indicadores quedan vacíos. El usuario registra la valoración y la meta; no se asigna una puntuación clínica a una persona sin haberla valorado.

## Datos del catálogo y propuestas educativas

Los códigos y etiquetas proceden de los JSON ya presentes en el repositorio. No se sustituyó el catálogo por otra edición ni se afirmó haber verificado cada código contra los libros oficiales.

`src/lib/paeCareSupport.ts` contiene asociaciones, observaciones, indicadores y actividades redactados para esta herramienta educativa. Se identifican como propuestas locales en la interfaz y en el formato. No reproducen los indicadores ni las actividades oficiales. Donde no hay propuesta disponible, el usuario puede añadir sus propios indicadores y actividades.

La escala local de logro de 1 a 5 no equivale a los anclajes específicos de cada resultado NOC. Debe adaptarse y documentarse para cada caso. El formato admite hasta cinco indicadores y seis actividades. Los diagnósticos de riesgo piden factores de riesgo y no exigen signos/síntomas de un problema ya presente.

Para completar el catálogo oficial se necesita una fuente autorizada con su edición, definiciones, dominios/clases, indicadores, actividades y relaciones verificadas. Las guías locales no resuelven esa ausencia documental y requieren revisión docente antes de una evaluación institucional.

Referencias conceptuales consultadas:

- https://nursing.uiowa.edu/center-for-nursing-classification-and-clinical-effectiveness
- https://nursing.uiowa.edu/cncce/nursing-outcomes-classification-overview
- https://nursing.uiowa.edu/cncce/nursing-interventions-classification-overview
- https://nanda.org/blog/recommendations-when-using-diagnoses-with-limited-or-no-related-risk-factors/

## Integración con la sala

Al finalizar una simulación, “Preparar PAE del caso” abre `/pae-assistant?scenario=<id>`. Solo se aceptan los identificadores del catálogo ficticio local. Se precargan datos iniciales del escenario y su diagnóstico médico esperado; no se precargan elecciones de taxonomía ni se transfiere una historia clínica real. La valoración debe actualizarse con los hallazgos que el alumno obtuvo en la sesión. No existe persistencia ni sincronización nueva con Supabase.

## Comprobación

```sh
node --test tests/paeAssistant.test.mjs tests/gynecologySimulation.test.mjs
npx tsc --noEmit
npm run build
```

Las pruebas del PAE comprueban la ausencia de sugerencias arbitrarias, casos representativos, negación simple, integridad de referencias a códigos, búsqueda tolerante y reparaciones de etiquetas. El formulario se verifica además en navegador con selección y cambio de NANDA, NOC y NIC; indicadores/actividades personalizados; vista imprimible y tamaño móvil.
