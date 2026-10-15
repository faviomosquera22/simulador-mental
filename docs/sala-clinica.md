# Sala clínica interactiva

Ruta: `/clinical-room`. Catálogo de escenarios relacionados: `/simulation-hub`.

## Alcance

Tres casos ficticios: dolor pélvico con sospecha de embarazo ectópico complicado, enfermedad inflamatoria pélvica grave y hemorragia posparto con sospecha de atonía. Las fichas incluyen referencias de NICE, CDC y OMS. El contenido y los criterios de evaluación requieren revisión docente antes de utilizarse como evaluación institucional.

La sala funciona sin llamadas a IA: utiliza un motor determinista, un monitor animado y imágenes fotorrealistas sintéticas con puntos de exploración interactivos. El acceso venoso y el oxígeno aparecen en la escena al registrarse esas intervenciones. La exploración pélvica y la ecografía requieren consentimiento previo.

## Uso

1. Elegir caso y modalidad antes de iniciar.
2. Iniciar, explorar los puntos de la paciente, registrar acciones y solicitar estudios.
3. Consultar Estudios para resultados; cada solicitud tiene un tiempo de espera simulado.
4. Registrar la hipótesis y finalizar para revisar aciertos, omisiones, acciones inseguras y tardías.
5. Descargar la evaluación en JSON o repetir el caso.

Las sesiones duran hasta 12 minutos simulados. `+30 s` adelanta el tiempo; Pausar detiene la evolución y el monitor. Consultar un diálogo pausa la sesión y cerrarlo restaura el estado anterior. Cambiar a otra pestaña del navegador pausa la simulación. El sonido es opcional.

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
- En móvil, un resumen de signos vitales permanece visible al desplazarse y las decisiones aparecen inmediatamente después del área de paciente. El monitor detallado sigue disponible más abajo.

No se cambiaron los casos, criterios de evaluación ni relaciones del PAE durante este rediseño. Se reutilizan las imágenes sintéticas documentadas en `public/clinical-room/README.md`.
