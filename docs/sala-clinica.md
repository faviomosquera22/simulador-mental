# Sala clínica interactiva

Ruta: `/clinical-room`. Catálogo de escenarios relacionados: `/simulation-hub`.

## Alcance

Cinco casos ficticios, incluidos preeclampsia grave y sepsis puerperal, además de dolor pélvico con sospecha de embarazo ectópico complicado, enfermedad inflamatoria pélvica grave y hemorragia posparto con sospecha de atonía. Las fichas incluyen referencias de NICE, CDC y OMS. El contenido y los criterios de evaluación requieren revisión docente antes de utilizarse como evaluación institucional.

La sala funciona sin llamadas a IA: utiliza un motor determinista, un monitor animado y imágenes fotorrealistas sintéticas con puntos de exploración interactivos. El acceso venoso y el oxígeno aparecen en la escena al registrarse esas intervenciones. La exploración pélvica y la ecografía requieren consentimiento previo.

## Uso

1. Elegir caso y modalidad antes de iniciar.
2. Iniciar, explorar los puntos de la paciente, registrar acciones y solicitar estudios.
3. Consultar Estudios para resultados; cada solicitud tiene un tiempo de espera simulado.
4. Registrar la hipótesis y finalizar para revisar aciertos, omisiones, acciones inseguras y tardías.
5. Descargar la evaluación en JSON o repetir el caso.

Las sesiones duran hasta 12 minutos simulados. `+30 s` adelanta el tiempo; Pausar detiene la evolución y el monitor. Los diálogos de cambio de caso y cierre pausan la sesión; los hallazgos se muestran dentro del panel sin pausarla. Cambiar a otra pestaña del navegador pausa la simulación. El sonido es opcional.

La sesión vive en memoria y se reinicia al recargar o cambiar de caso. La descarga es local: no se integra todavía con el historial ni se sincroniza con Supabase. Los resultados de laboratorio y la evolución fisiológica son representaciones educativas simplificadas; los intervalos de respuesta no representan tiempos asistenciales reales. Coordinar atención definitiva ralentiza el deterioro y no equivale a curación. El sangrado acumulado no disminuye retroactivamente al tratar.

## Evaluación

75 puntos por prioridades críticas, 25 por la hipótesis esperada; se restan 15 por cada acción insegura y 5 por cada prioridad tardía. Una omisión crítica limita la puntuación a 69. Una puntuación alta no acredita competencia profesional. En modo evaluación se oculta la orientación hasta finalizar; los hallazgos y resultados clínicos siguen disponibles.

## Estructura

- `src/lib/gynecologySimulation.ts`: casos, requisitos previos, evolución, resultados y puntuación.
- `components/clinical-room/ClinicalRoom.tsx`: controles, decisiones, diálogos y exportación.
- `components/clinical-room/PatientScene.tsx`: escena fotorrealista, seguimiento de zonas exploradas y capas de oxígeno y vía venosa.
- `public/clinical-room/`: imágenes sintéticas; su README documenta herramienta y prompts.
- `components/advanced/MultiparameterMonitor.tsx`: monitor compartido, presentación compacta `bedside` y pausa opcional.

El menú agrupa Urgencias, Triage, RCP, Simulador dinámico y Materno-infantil en Escenarios y urgencias; las rutas anteriores siguen disponibles. El catálogo del dashboard incorpora la nueva sala. Se corrigió la dependencia circular entre la selección del escenario y el reinicio en Urgencias, RCP, Materno-infantil y Simulador dinámico: los reinicios reciben ahora el escenario explícitamente y mantienen una referencia estable.

## Verificación

Con Node.js 22.18+ o 24, ejecutar:

```sh
node --test tests/gynecologySimulation.test.mjs
npx tsc --noEmit
npm run build
```

El repositorio usa `package-lock.json`; instalar las dependencias de despliegue con `npm ci`. Las credenciales de Supabase y Gemini continúan siendo necesarias para las funciones existentes que las utilizan. La navegación tolera la ausencia de configuración de Supabase al previsualizar la sala localmente.

Al terminar, “Preparar PAE del caso” permite iniciar la planificación de cuidados con los datos iniciales ficticios del escenario. Consulta `docs/pae-asistido.md` para el alcance y los límites de la taxonomía importada.

## Presentación de la sala

La experiencia tiene una composición propia: paciente en un escenario amplio a la izquierda, monitor compacto y decisiones a la derecha, con una barra de atención situada debajo de la paciente. La navegación puede ocultarse con “Expandir sala” sin modificar las preferencias globales del menú.

- La cámara permite acercar/restablecer la vista y mostrar/ocultar los puntos de exploración. La imagen, los puntos y las capas de tratamiento comparten el mismo marco para conservar su alineación.
- El recorrido clínico muestra actividad registrada en valoración, exploración, estudios y coordinación. No es una puntuación ni exige un orden de decisiones.
- Los estudios pendientes muestran su tiempo de procesamiento y una barra de progreso. El resultado solo aparece cuando termina el tiempo simulado.
- El gráfico de evolución reconstruye FC y presión sistólica con el mismo motor del escenario y las decisiones registradas hasta cada instante. No añade una segunda fórmula de evolución ni anticipa decisiones futuras. Los valores del gráfico corresponden al motor; el monitor conserva sus pequeñas oscilaciones visuales simuladas.
- En móvil, el monitor compacto queda sobre el área de atención; paciente y decisiones permanecen uno junto al otro, con desplazamiento propio para los paneles.

Se reutilizan las imágenes sintéticas documentadas en `public/clinical-room/README.md`.

## Atención persistente y claves obstétricas

La sala mantiene al paciente, al monitor y a las categorías de acciones dentro de la altura disponible de la ventana. Las decisiones, los estudios y el registro tienen desplazamiento propio. En pantallas pequeñas se muestra un monitor compacto con FC, SpO₂, PA, FR, temperatura y ECG; la paciente y las decisiones comparten el espacio inferior. Los hallazgos se consultan dentro del panel de decisiones y ya no abren un diálogo ni pausan la evolución. Solo cambiar de caso o confirmar el cierre abre un diálogo y pausa.

Urgencias, Simulador dinámico, Materno-infantil y RCP incorporan una cabecera persistente con los datos del paciente, monitor y las acciones ejecutables de la fase actual. Utiliza el estado y los controladores de cada simulador; la evolución sigue sus decisiones por etapas. Las oscilaciones de señal son ilustrativas y no constituyen un segundo motor fisiológico.

La sala añade dos casos ficticios (preeclampsia con signos de severidad y sepsis materna con choque), para practicar las claves azul y amarilla, además de la roja en hemorragia posparto. Cada caso obstétrico permite elegir entre las tres claves: la pertinente es una prioridad evaluable y las incorrectas reciben retroalimentación y penalización. La EIP no se trata como sepsis obstétrica.

En hemorragia posparto se puede valorar y colocar el traje antichoque no neumático (TANN), con representación gráfica esquemática sobre la paciente. Requiere valoración previa y activación de clave roja. Su efecto es temporal y no resuelve la causa; el retiro durante el choque se evalúa como inseguro. Esta representación no es un tutorial de colocación. El contenido se referencia al [Protocolo MSP Ecuador 2025](https://intranet.hospitalguayaquil.gob.ec/storage/manuales/GUIAS%20PRACTICAS%20CLINICAS/2025%20-%20Protocolo%20Score%20MAMA%CC%81%20y%20Claves%20Obste%CC%81tricas%202025.pdf), apartados de claves y anexo 8.

El motor de la sala aplica respuestas graduales durante 45 segundos simulados para ilustrar la reevaluación tras tratamiento; ese intervalo es didáctico. La hipertensión empeora hacia presiones mayores y responde al antihipertensivo. El soporte con líquidos afecta la perfusión sin detener directamente el sangrado; el sangrado previo permanece acumulado. La activación de una clave organiza la respuesta y no produce por sí sola una mejoría fisiológica.

## Catálogo y preguntas

La actualización de octubre de 2026 añade medicación por familias, presentaciones, alternativas con prioridades equivalentes, registro de errores, preguntas durante la atención y dos preguntas finales por caso. Consulte [clinical-education.md](clinical-education.md) para fuentes MSP, limitaciones, recursos gráficos y validación.

La sala se denomina ahora **Sala interactiva ginecológica**, con distribución de cabecera equivalente a cuidados críticos y cinco canales de monitorización a demanda. Las preguntas son ventanas obligatorias y contribuyen a la nota final. El detalle actualizado está en [clinical-education.md](clinical-education.md).

El catálogo se amplió a 11 casos: dos ginecológicos y tres por cada clave obstétrica (roja, azul y amarilla). Los seis escenarios nuevos y sus diferencias de manejo se detallan en [clinical-education.md](clinical-education.md). El selector permite filtrar y leer una breve entrega antes de preparar cada caso.
