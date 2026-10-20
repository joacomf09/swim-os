# SWIM OS — web app

Carpeta lista para publicar. Todo va incluido (librerías, fuentes, iconos), así que funciona sin conexión una vez abierta.

## Publicarla sin GitHub (Netlify Drop, gratis)
1. Descomprime el zip.
2. Entra en https://app.netlify.com/drop desde el ordenador.
3. Arrastra la carpeta `swim-os-app` entera a la página.
4. Crea la cuenta gratuita cuando te lo pida (si no, el sitio caduca en 1 hora).
5. Copia la URL https que te da. En Site settings puedes cambiar el nombre (p. ej. `swim-os-joaquin.netlify.app`).

Alternativa equivalente: Cloudflare Pages → Upload assets.

## Instalarla en el iPhone
1. Abre la URL en **Safari** (no en Chrome).
2. Compartir → **Añadir a pantalla de inicio**.
3. Ábrela una vez con conexión: a partir de ahí funciona offline.

## Actualizar
Sube la carpeta de nuevo (Deploys → arrastrar). Antes, cambia `swim-os-v1` por `swim-os-v2` en `sw.js`; si no, los móviles siguen con la versión guardada.

## Datos
Rutina e historial se guardan en el dispositivo. Usa Historial → Exportar copia de vez en cuando. Si borras la app de la pantalla de inicio, se borran sus datos.
