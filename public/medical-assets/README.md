# Medical Assets

Este directorio queda reservado para reemplazar presets SVG por imagenes reales o semirrealistas.

## Estructura sugerida

- `public/medical-assets/clinical-images/<categoria>/<archivo>`
- `public/medical-assets/ultrasound/<categoria>/<archivo>`

## Convencion recomendada

- `reference-*.png` para la imagen limpia de comparacion
- `case-*.png` para la imagen con hallazgo
- usar proporciones cuadradas o casi cuadradas
- evitar marcas de agua, overlays externos o texto incrustado

## Ejemplos de rutas

- `/medical-assets/clinical-images/radiologia_torax/reference-cxr-normal.png`
- `/medical-assets/clinical-images/radiologia_torax/case-cxr-pneumonia.png`
- `/medical-assets/ultrasound/trauma/reference-fast-ruq.png`
- `/medical-assets/ultrasound/trauma/case-fast-ruq-fluid.png`

## Integracion

Cada caso puede declarar:

- `realImageAssets.referenceSrc`
- `realImageAssets.caseSrc`
- `realImageAssets.referenceAlt`
- `realImageAssets.caseAlt`
- `realImageAssets.fit`

Si la imagen no existe o falla, el visor vuelve automaticamente al preset SVG.
