# Sangrado, TANN y preparación de tratamientos

Cambios locales del 22 de octubre de 2026.

## Comportamiento

- Cuidados críticos incorpora el caso ya existente de hemorragia obstétrica en la biblioteca. Usa la imagen de paciente femenina y permite colocar el TANN por pasos.
- La sangre externa aparece sobre un paño a la altura perineal. El tamaño de la mancha refleja cualitativamente la pérdida acumulada; las gotas y su movimiento reflejan la persistencia del sangrado. Pausar detiene la animación; controlar la fuente no borra la pérdida previa. No se representan pérdidas internas como si fueran sangre externa.
- En ginecología, seleccionar **Hemorragia posparto · traje antichoque TANN** y abrir **Claves y TANN**. Se conservan la valoración, consentimiento, preparación, cierre ascendente de los seis componentes y verificación. Los pasos posteriores siguen bloqueados. Colocar el traje no elimina por sí solo el sangrado.
- La cánula se sitúa en las narinas, debajo de los ojos. Las mascarillas tienen su propia representación. El equipo permanece en la misma capa y coordenadas que la imagen al cambiar la vista o acercar al paciente.
- **Oxígeno / ventilador** permite elegir cánula, mascarilla simple o mascarilla con reservorio; admite incrementos de 0,5 L/min dentro del rango del dispositivo. Elegir no conecta: se debe aplicar. Se registra dispositivo, flujo y retirada, y cambia gradualmente la respuesta cualitativa a la oxigenación. El caso intubado conserva el ventilador y su ventilación minuto; la práctica no simula una extubación por cambiar de dispositivo.
- Todos los medicamentos de cuidados críticos requieren cantidad positiva y unidad compatible. Paracetamol y amoxicilina incorporan varias concentraciones y cálculo de miligramos según comprimidos, cápsulas o mL. La presentación IV de paracetamol requiere acceso venoso; sus presentaciones orales no lo requieren. Cambiar presentación no elude el límite de repetición. Se conservan vía, cantidad, concentración y total calculado en las decisiones y el registro descargable.
- La administración oral con conciencia o vía aérea no seguras genera consecuencias de aspiración en el modelo. La preparación no administra hasta confirmar.

## Alcance del modelo

La cantidad elegida es un dato verificable del registro. La respuesta farmacológica sigue siendo cualitativa: no se ha introducido una relación dosis-respuesta clínica validada ni una calificación de dosis terapéutica correcta. Los fármacos genéricos no identificados por principio activo no reciben concentraciones inventadas. Para infusiones se registra la unidad seleccionada; no se infiere una dosis total sin duración, peso o concentración documentados.

El control definitivo de los escenarios actuales representa coordinación y respuesta parcial; si persiste una tasa de pérdida positiva, la imagen sigue mostrando sangrado. Los escenarios sin pérdida externa aparecen limpios. El TANN conserva el acceso perineal ilustrativo.

## Referencias de implementación

- [OMS: compendio de dispositivos, aplicación ascendente del NASG](https://iris.who.int/bitstream/handle/10665/202537/9789241509992_eng.pdf). Se conserva la agrupación del TANN según el anexo 8 de MSP 2025 ya utilizada por el proyecto.
- [BTS: dispositivos y flujos de oxígeno](https://www.brit-thoracic.org.uk/document-library/guidelines/emergency-oxygen/bts-guideline-for-oxygen-use-in-adults-in-healthcare-and-emergency-settings/). Los rangos de la interfaz no sustituyen objetivos individuales de saturación; no se calcula una FiO₂ exacta a partir del caudal.
- [AEMPS: paracetamol oral 1 g divisible](https://cima.aemps.es/cima/dochtml/ft/70310/FichaTecnica_70310.html).
- [DailyMed: paracetamol IV 10 mg/mL](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=db5d4cf8-762a-4111-971e-91c704bc3643).
- [DailyMed: amoxicilina, cápsulas y suspensiones](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=35651b85-b735-7299-e054-00144ff8d46c). Las presentaciones son ejemplos educativos, no un inventario de Ecuador.

## Verificación

Pruebas de motor existentes y nuevas en `tests/criticalCarePreparation.test.mjs`: límites y medios litros, retirada, pausa y reinicio; cambios en oxigenación; dosis y unidades inválidas; cálculo de concentración; vía oral/IV; riesgos orales; sangrado acumulativo; TANN incompleto y verificado.

Revisión en Chrome: conexión a 1,5 L/min, cambio a mascarilla, retirada, preparación y administración de 750 mg desde comprimidos de 500 mg; pasos 1–6 y verificación del TANN ginecológico con sangrado persistente y vista móvil.

Resultado de verificación: 88 pruebas de lógica aprobadas, TypeScript y ESLint de los archivos cambiados sin errores, compilación de producción correcta. Chrome verificó también el séptimo caso crítico, los ocho pasos de preparación/cierre/reevaluación, la conservación del ventilador en el caso intubado y la vista móvil. Las capturas de revisión están en esta carpeta.
