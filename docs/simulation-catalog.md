# Catálogo por carrera y presentación uniforme

El catálogo público vive en `/simulation-hub`, con rutas específicas `/simulation-hub/enfermeria`, `/simulation-hub/medicina` y `/simulation-hub/psicologia`.

`src/lib/simulationCatalog.ts` define la organización. Enfermería reúne cuidados, valoración, procedimientos y documentación; Medicina reúne casos clínicos, estudios e interpretación; Psicología reúne entrevista, primeros auxilios psicológicos, triage por carrera y preparación académica. Los módulos compartidos figuran en todas las carreras asignadas, con una etiqueta que lo indica. La organización no modifica el perfil ni los permisos del usuario. Ningún módulo existente desaparece del catálogo.

Cada carrera incluye subcategorías, un buscador que admite términos con o sin tildes, accesos a cada sección, contador de resultados y tarjetas con el mismo formato. El dashboard y el menú apuntan a estas mismas rutas. La selección de un recurso abre la ruta original del módulo, sin duplicar su lógica ni crear versiones de un mismo caso por carrera.

Las páginas con menú utilizan el marco `psyke-workspace`, dentro del ancho común de la aplicación. Se eliminaron los distintos máximos de ancho y márgenes anidados. El menú de escritorio conserva su anchura entre navegaciones mediante un proveedor situado en el layout raíz, permanece accesible durante el desplazamiento y se adapta al móvil mediante el mismo cajón. Se reserva el espacio de la barra de desplazamiento para evitar movimientos laterales.

Cuidados críticos conserva la navegación al pasar de biblioteca a preparación y atención. La sala ginecológica comienza con navegación visible; ampliar el espacio es una decisión explícita mediante su control existente. Primeros auxilios psicológicos usa también el marco de navegación común. No se cambiaron decisiones clínicas, parámetros, puntuaciones, llamadas de IA ni credenciales.

## Verificación

```sh
node --test tests/simulationCatalog.test.mjs
PAP_BASE_URL=http://127.0.0.1:3100 node scripts/test-simulation-catalog-browser.cjs
npm run build
```

Las pruebas del catálogo verifican cobertura de todos los módulos, ausencia de referencias inexistentes o repetidas, asignación por carrera y búsqueda. El recorrido de navegador compara borde izquierdo y ancho real en diez rutas, comprueba la conservación del menú plegado al navegar, el cambio de biblioteca a atención en cuidados críticos, búsqueda y limpieza, navegación móvil y ausencia de desbordamiento horizontal. Las capturas se guardan en `/tmp/psyke-catalog-desktop.png` y `/tmp/psyke-catalog-mobile.png`.
