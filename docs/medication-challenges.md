# Retos de medicación

Reestructuración local del 23 de octubre de 2026 de `/medications`.

## Experiencia

1. Elegir Fácil, Medio o Difícil y generar un caso breve aleatorio.
2. Leer contexto, objetivo, alergias y dos datos relevantes.
3. Buscar en el botiquín por nombre, sinónimo, familia o vía.
4. Seleccionar medicamento y presentación/vía; la selección se muestra en la bandeja.
5. Preparar y confirmar la administración simulada, o retener y consultar.
6. Revisar la elección, explicación, seguimiento y fuente; pasar al siguiente caso.

El banco contiene 12 situaciones clínicas revisables, cuatro por nivel, y 20 medicamentos/productos. Es una selección aleatoria de casos escritos, no generación libre mediante IA. No se repiten casos del nivel hasta agotar los no vistos; después se evita repetir el caso inmediatamente anterior.

Los niveles cambian el problema: necesidades sintomáticas claras; relación entre indicación, presentación y vía; o priorización urgente y riesgos como alergia grave, bradicardia o deglución no segura. Se aceptan alternativas compatibles explícitas cuando corresponden al contexto, sin afirmar que el botiquín agote todas las opciones clínicas.

La búsqueda no prioriza la respuesta correcta. Las explicaciones y respuestas compatibles se muestran después de confirmar. Preparar o cancelar no cuenta como administración. Cada caso se evalúa una vez; la sesión muestra casos completados, decisiones adecuadas y racha. Los contadores se mantienen al cambiar de nivel o visitar el ejercicio anterior, dentro de la página abierta; no se guardan como historial clínico ni se sincronizan con una base de datos.

## Alcance

Este modo evalúa la selección de medicamento y vía dentro de un plan educativo descrito. No evalúa dosis, dilución ni velocidad ni afirma respuesta fisiológica del paciente. El modo previo con órdenes, cálculo de volumen y controles permanece accesible desde **Órdenes y cálculo**.

El catálogo de simuladores mantiene el mismo identificador y ruta, con descripción y contador de los 12 retos nuevos. No se cambiaron los simuladores de cuidados críticos ni ginecología.

## Evidencia y validación

- Pruebas unitarias de `tests/medicationChallenges.test.mjs`: datos y objetivos válidos, búsqueda normalizada, aleatoriedad por nivel, ausencia de repeticiones, todas las combinaciones de medicamento/vía, alternativas correctas, retención y entradas incompletas.
- `tests/simulationCatalog.test.mjs`: conservación de módulos y rutas por carrera.
- `scripts/test-medication-challenges-browser.cjs`: recorrido de los 12 casos, búsqueda sin resultados y por sinónimo, selección, visibilidad de la bandeja, cancelación, confirmación, respuesta correcta/incorrecta, retención, contadores, vista móvil y acceso/retorno al modo anterior.
- Las capturas `medication-challenges-*.png` están en esta carpeta.

Las referencias clínicas se consultan desde el resultado de cada caso: NICE sobre seguridad/alergias e hipoglucemia; GINA 2026 sobre asma; RCUK sobre anafilaxia; CDC sobre faringitis estreptocócica; NHS sobre analgesia, antihistamínicos y rehidratación. Los casos siguen requiriendo revisión docente y adaptación al rol y protocolos institucionales.
