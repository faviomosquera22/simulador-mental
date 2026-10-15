# CACES: banco local Ecotec y cinco componentes

La ruta `/caces` (y su alias `/simulator/caces`) utiliza ahora las preguntas locales importadas de `CACESECOTEC-main`. La pantalla presenta únicamente cinco componentes de Enfermería:

| Componente | Preguntas únicas importadas |
| --- | ---: |
| Cuidado y procedimientos clínicos de enfermería | 1.214 |
| Mujer, recién nacido, niño y adolescente | 1.129 |
| Adulto y adulto mayor | 215 |
| Cuidado familiar, comunitario e intercultural | 271 |
| Bases educativas, administrativas, investigativas y epidemiológicas | 334 |
| Total | 3.163 |

Se eliminaron de esta pantalla los grupos adicionales (Score MAMÁ, urgencias, esenciales, alta dificultad y otros) y el segundo nivel de filtros de componente/subcomponente/tema. No se borraron los bancos históricos del código ni los resultados locales anteriores.

## Importación y trazabilidad

Archivos del proyecto de origen utilizados:

- `src/data/enfermeriaQuestions.json`: 3.252 registros.
- `src/data/enfermeriaOctubreDocumentoQuestions.json`: 38 registros.
- `src/data/enfermeriaFundamentosDocumentoQuestions.json`: 31 registros.

De los 3.321 registros de estos archivos se importaron 3.163, se unificaron 99 duplicados y se separaron 59 registros que no cumplen el formato o presentan contradicciones. El detalle está en `src/lib/data/ecotecImportAudit.json`.

Se ejecutaron las funciones puras `repairQuestionText` e `isUsableQuestion` de la copia local de origen, junto con sus correcciones JSON existentes. No se consultaron credenciales ni se modificó el proyecto original. Se conservan los textos resultantes de esas correcciones, las cuatro alternativas y la clave explícita. No se generaron distractores ni respuestas. Las tres imágenes de apoyo utilizadas se copiaron a `public/ecotec-questions/` y se muestran tanto durante el intento como en la revisión de errores.

La importación verifica estructura y consistencia; no implica una revisión clínica independiente ni aval institucional. Las explicaciones son las del banco de origen; cuando falta una, se indica la clave suministrada, sin inventar una justificación clínica.

Las colecciones `enfermeriaComponenteIntegralQuestions.json` (43), `enfermeriaIntegralSeptiembreQuestions.json` (57) y `enfermeriaIntegral18And19Questions.json` (199) están etiquetadas como Componente Integral y no tienen asignación a uno de los cinco componentes. Permanecen pendientes de clasificación docente y no se incorporan por inferencia. Tampoco se importó Psicología ni se sincronizaron correcciones o preguntas que solo puedan existir en Supabase.

## Funcionamiento

Se puede practicar un componente o combinar varios. La mezcla conserva el muestreo equitativo del simulador. Se mantienen los modos de 5 a 120 preguntas, el temporizador, retroalimentación inmediata/final y el historial local.

La práctica adicional con IA queda desactivada por defecto. Cuando se activa, solo se admite contenido dentro de los cinco componentes y una pregunta generada duplicada no reemplaza la clave de origen de Ecotec. Las preguntas de fuentes antiguas almacenadas en caché no reactivan categorías eliminadas.

El campo de dificultad numérica del motor utiliza un valor técnico de compatibilidad para las preguntas sin escala comparable de origen; no se muestra como una dificultad evaluada y se retiró ese selector de esta pantalla. El filtro de tipo (directa/caso) conserva la clasificación de presentación del simulador, no una clasificación oficial del banco.

## Archivos y verificación

- `src/lib/cacesEcotec.ts`: adaptación al motor y composición del banco.
- `src/lib/data/ecotecQuestions.json`: copia importada, con procedencia por pregunta.
- `src/lib/data/ecotecImportAudit.json`: exclusiones, duplicados y recuentos.
- `scripts/import-ecotec.mjs`: importación reproducible de solo lectura sobre el origen.

Para repetir la importación con la copia local disponible:

```sh
node scripts/import-ecotec.mjs /ruta/a/CACESECOTEC-main
```

Para comprobar la integración:

```sh
node --test tests/cacesEcotec.test.mjs
npx tsc --noEmit
npm run build
```
