# SWIM OS 2.0 — generador inteligente de entrenamientos de natación

App web (PWA) sin compilación ni dependencias de instalación: React, htm, fuentes e iconos van incluidos, así que funciona sin conexión una vez abierta.

## Qué hay de nuevo en 2.0
- **+ CREAR NUEVO ENTRENAMIENTO**: configurador de 6 pasos (distancia, piscina, ejercicios, material, bloques, objetivo/intensidad/descansos/nivel).
- **Motor generador** (`src/engine/`): suma exacta en metros, múltiplos de la piscina, semilla reproducible, sin sprints sin preparación, sin material que no tengas. Si la configuración es imposible, lo explica y propone arreglos concretos.
- **Otra opción**, **favoritos** y **regenerar solo un bloque** (calentamiento / principal / resistencia).
- **Editor manual** con "DISTANCIA PLANIFICADA: x / y m" siempre visible.
- **Modo entrenamiento**: cronómetro por serie con tiempo real, descanso saltable, vista previa de la siguiente serie, progreso por bloque, pausa y reanudación; se guarda y sobrevive a recargas.
- **Biblioteca** de 43 ejercicios con ilustraciones SVG locales, errores comunes y recomendaciones.
- **Historial y estadísticas** con gráficos interactivos (solo datos medidos; no se inventan pulsaciones ni calorías).
- **Preferencias** persistentes y nivel (principiante / intermedio / avanzado).

Tu rutina y tu historial de la versión 1 se migran solos al abrir la 2.0.

## Desarrollo
Requiere solo Node 20+ (para los tests; la app no necesita compilarse).

```
npm test          # 40 tests del motor, sesión, historial y propiedades con semillas aleatorias
npm run check     # sintaxis, archivos referenciados y caché sin conexión
npm run verify    # ambos
npm run sw        # regenera sw.js con todos los archivos (hacelo si agregás o quitás archivos)
python3 -m http.server 8000   # y abrí http://localhost:8000
```
Los módulos ES no se cargan desde `file://`: usá un servidor local o la URL publicada.

Estructura: `src/library.js` (ejercicios) · `src/engine/` (configuración, candidatos, generador, validador, edición, sesión, historial; sin React) · `src/ui/` (pantallas) · `src/app.js` (raíz) · `tests/`.

## Publicar (GitHub Pages desde `main`)
1. Abrí un Pull Request de `feature/swim-os-2` hacia `main` y revisalo.
2. Al hacer merge, GitHub Pages publica solo (1–2 minutos).
3. Si cambiaste archivos, corré `npm run sw 3` (sube la versión de caché) antes del merge para que los móviles se actualicen.

## Instalarla en el iPhone
1. Abrí la URL en **Safari**. 2. Compartir → **Añadir a pantalla de inicio**. 3. Abrila una vez con conexión.

## Datos
Todo se guarda en el dispositivo (rutina, historial, favoritos, preferencias). En **Ajustes → Exportar copia** hacés un respaldo; si borrás la app de la pantalla de inicio se borran sus datos.

## Límites conocidos
- El cronómetro usa marcas de reloj reales: con la pantalla bloqueada el tiempo sigue siendo correcto al volver, pero el navegador puede no emitir pitidos en segundo plano (iOS no vibra desde la web).
- La duración estimada es orientativa hasta que tengas sesiones medidas.
