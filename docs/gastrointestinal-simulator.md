# Guardia de infecciones gastrointestinales

Ruta `/gastrointestinal`, integrada en el dashboard y el catálogo de Enfermería. Primera versión: un adulto ficticio de 35 años, 70 kg, con diarrea acuosa aguda y signos de deshidratación, consciente y capaz de beber. La etiología permanece sin confirmar. Dos recorridos: respuesta inicial al cuidado y vómitos persistentes con hipoperfusión. Práctica guiada y evaluación comparten las mismas reglas clínicas.

## Interacción y estado

El estudiante hace evaluación rápida, verifica identidad, realiza higiene, utiliza protección para el contacto, entrevista sobre síntomas/exposición/antecedentes, mide temperatura y signos vitales, valora abdomen e hidratación y registra pérdidas. Las preguntas y los hallazgos quedan en la historia; abrir la historia no completa acciones.

Cada imagen de material se selecciona antes de usarla. Una tarjeta y un indicador sobre el paciente muestran qué está seleccionado. Arrastrar, tocar un destino o pulsar «Utilizar» recorren la misma validación. Hay marcadores de paciente, cabeza, brazo, abdomen, manos, mesa y residuos. HTML Drag and Drop sirve en escritorio; Pointer Events permiten arrastre táctil. El paciente compacto permanece visible en móvil, con acceso a la historia y ampliación del retrato.

Los guantes tienen estados nuevo, en uso y descartado. Retirarlos exige nueva higiene. La solución requiere un sobre preparado con 1000 mL porque así lo indica el envase ficticio; otros productos pueden requerir otro volumen. El sobre no puede prepararse dos veces. Se muestra el volumen restante. Las herramientas de medición no se presentan como consumibles desechados.

Cada error abre un diálogo nativo con motivo y recomendación; la intervención incorrecta no se ejecuta. El fondo queda bloqueado mientras se lee. Los errores se conservan en bitácora y puntuación. La selección o lectura de una alerta no realiza tratamiento. Pausar bloquea actuaciones y tiempo. Reiniciar requiere una decisión explícita. No se persiste información clínica en el servidor.

## Plan individual y evolución ilustrativa

Después de valorar, el estudiante elige rehidratación oral con observación. El plan supervisado de ESTE adulto ficticio es 1000 mL en dos horas si tolera, repartidos en cuatro porciones de 250 mL ofrecidas en sorbos durante intervalos de 30 minutos, con reevaluación y ajuste por pérdidas. No es una pauta universal ni un cálculo de déficit validado. La indicación real depende de gravedad, tolerancia, pérdidas, comorbilidad y protocolo.

Ofrecer una porción no la registra automáticamente como ingesta ni mejora de inmediato los signos: se debe observar el intervalo y reevaluar antes de continuar. La porción reservada se incorpora al balance al completar el intervalo de observación, nunca por estar solamente preparada. El tiempo avanza por una acción explícita, no por cuánto tarda el estudiante en leer. La cifra de FC y PA utiliza un modelo determinista ilustrativo; no predice una respuesta clínica real.

En el recorrido estándar se registra una deposición de 150 mL al minuto 60 y orina de 200 mL al minuto 120. El balance parcial final es +650 mL, sin estimar el volumen de las seis deposiciones y dos vómitos referidos antes del inicio. Ese balance no representa el déficit inicial y no concede un alta. El cierre requiere balance actualizado, reevaluación, revisión de estudios, educación y entrega explícita para continuar observación.

En el recorrido de intolerancia, al minuto 60 aparece vómito medido de 300 mL y signos de hipoperfusión: PA 90/58, FC 124, relleno capilar de 4 s. También puede activarse una rama de seguridad si se prolonga el tiempo sin reposición suficiente. El plan oral queda bloqueado. Solicitar ayuda es accesible incluso antes de completar trámites rutinarios. Se exige proteger al paciente, preparar material de acceso según protocolo y confirmar la entrega al equipo receptor. Una llamada previa al deterioro no cuenta como respuesta al incidente. No se administran líquidos IV, antibióticos ni antidiarreicos de forma automática, ni se declara resuelta la complicación.

## Fuentes y límites

Reglas adaptadas de guías para diarrea infecciosa: valorar gravedad y pérdidas; SRO de osmolaridad reducida cuando la deshidratación y la tolerancia lo permiten; atención urgente y fluidos isotónicos indicados por personal competente cuando hay shock/fallo de rehidratación oral; pruebas y antimicrobianos según indicación. No se enseña a deducir un agente por síntomas inespecíficos. No se aplican pautas pediátricas al adulto.

- [IDSA, guía de diarrea infecciosa](https://www.idsociety.org/practice-guideline/infectious-diarrhea/), valoración, pruebas y soporte, recomendaciones 1, 5, 8, 36 y 39–45.
- [OMS, enfermedades diarreicas](https://www.who.int/news-room/fact-sheets/detail/Diarrhoeal-disease), prevención y medidas de atención.
- [OMS, libro AWaRe](https://iris.who.int/bitstream/handle/10665/365237/9789240062382-eng.pdf), capítulo de diarrea infecciosa aguda/gastroenteritis.
- [MSF, sales de rehidratación oral](https://medicalguidelines.msf.org/en/viewport/EssDr/english/oral-rehydration-salts-ors-16684387.html), preparación según producto.

Se debe adaptar a la guía institucional y revisar con docentes. La puntuación es una devolución educativa, no una certificación de competencia. Recursos de apariencia fotográfica, prompts y procedencia: [README de imágenes](../public/gastrointestinal/README.md).

## Verificación

- `node --test tests/gastrointestinalSimulation.test.mjs`: rutas completas, requisitos de valoración, concentración, tiempo, tolerancia, inventario, balance, medicación, errores retenidos, pausa y escalamiento.
- `node scripts/test-gastrointestinal-browser.cjs`: recorridos estándar y de deterioro, modal correctivo, selección sin intervención, arrastre real, teclado y vista móvil. Variables `GI_BASE_URL`, `GI_PLAYWRIGHT_MODULE`, `GI_CHROME_PATH`.
- Compilación Next.js, TypeScript y ESLint del alcance modificado.
