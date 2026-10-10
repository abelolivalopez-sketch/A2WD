# A2WD

Agencia de diseño web de **Abel Oliva López** y **Ariel** ([@AOcchietti](https://github.com/AOcchietti)). Este repositorio contiene la web pública de A2WD, el portal de clientes (que también se instala como app en el móvil) y las demos que usamos para captar clientes.

- **Web publicada:** https://abelolivalopez-sketch.github.io/A2WD/ (GitHub Pages, rama `main`)
- **Portal / app:** https://abelolivalopez-sketch.github.io/A2WD/portal/login.html
- **Contacto:** a2wd.web@gmail.com

## Qué hay aquí

| Parte | Dónde | Guía |
|---|---|---|
| Web pública (home galáctica, proyectos, legal) | `index.html`, `proyectos.html`, `legal.html`, `assets/` | [docs/WEB-GUIA.md](docs/WEB-GUIA.md) |
| Portal de clientes y panel de creadores | `portal/` | [docs/PORTAL-GUIA.md](docs/PORTAL-GUIA.md) |
| App del móvil (PWA) | `manifest.webmanifest`, `sw.js`, `instalar.js`, `img/icono-*` | [docs/PORTAL-GUIA.md](docs/PORTAL-GUIA.md#app-para-el-móvil) |
| Base de datos y funciones (Supabase) | `supabase/` | [docs/PORTAL-GUIA.md](docs/PORTAL-GUIA.md) |
| Demos para prospección | `demos/` (no indexadas) | — |
| Tarifas internas | `tarifas.js` | [docs/PORTAL-GUIA.md](docs/PORTAL-GUIA.md#tarifas) |
| Hoja de ruta y tareas pendientes | — | [docs/PENDIENTES.md](docs/PENDIENTES.md) |
| Plan para publicar la app en Google Play | — | [docs/PLAY-STORE.md](docs/PLAY-STORE.md) |

```
/
├── index.html · proyectos.html · legal.html   ← páginas de la web
├── manifest.webmanifest · sw.js · instalar.js ← app (PWA)
├── tarifas.js · robots.txt · sitemap.xml
├── assets/      css y js de la web pública
├── portal/      acceso, panel de cliente y panel de creador
├── supabase/    SQL de las tablas y Edge Functions
├── demos/       webs de muestra para clientes potenciales
├── img/ fonts/ vendor/   imágenes, tipografías y librerías alojadas aquí
├── herramientas/         scripts de mantenimiento (CSP del portal)
├── docs/        guías, pendientes y plan de Play Store
└── recursos/originales/  fotos y capturas originales (no se cargan en la web)
```

No hay empaquetador ni `npm install`: se edita el archivo y se sube. Para verlo en local, `python -m http.server` en la raíz y abre `http://localhost:8000`.

## Cómo trabajamos con Git

- **`main`** es lo que está publicado. No se toca directamente: todo entra por *pull request*.
- **`abel`** y **`ariel`** son las ramas de trabajo de cada uno. Antes de empezar algo nuevo, ponla al día con `main`:
  ```bash
  git checkout abel
  git pull origin main
  ```
- Para algo grande (un rediseño, una demo nueva) se puede abrir una rama con nombre propio (`demo-<cliente>`, `rediseno-<zona>`) y borrarla cuando se haya fusionado.
- Al cambiar algo del portal, sube `VERSION` en `sw.js` para que las apps instaladas se actualicen.
- Si cambias un `<script>` escrito dentro de `portal/*.html`, ejecuta `node herramientas/actualizar-csp.mjs` antes de subirlo.

### Con GitKraken

1. Abre el repositorio `A2WD` y, en el panel izquierdo, haz doble clic en la rama **`abel`** (local) para trabajar en ella.
2. Pulsa **Pull** antes de empezar: trae lo último que se haya subido a `abel` (también lo que suba Claude).
3. Haz clic en un commit del gráfico para ver qué archivos cambió; al pulsar un archivo ves el antes (rojo) y el después (verde).
4. Tras editar: en el panel derecho, **Stage all changes**, escribe el mensaje del commit y **Commit**; luego **Push**.
5. Para enseñárselo al otro basta con que haga **Pull** de `abel`. Cuando los dos estéis de acuerdo, botón derecho sobre `abel` y la opción de crear un *pull request* hacia `main` (la web publicada).

### Supabase

Los cambios de base de datos se guardan como archivos `.sql` en `supabase/` (y las funciones en `supabase/functions/`), para que GitKraken también los muestre. Primero se prueban en Supabase y después se sube el archivo a la rama.

### Estado de las ramas (7 oct 2026)

| Rama | Estado |
|---|---|
| `main` | Publicada. Incluye todo lo de las demás ramas. |
| `abel` | `main` + reorganización, botón «Volver a la web» del portal y arreglos de imágenes. Pendiente de enseñar a Ariel. |
| `ariel` | Atrasada; sus 2 últimos commits se anulan entre sí (nebulosa añadida y revertida). Ariel puede ponerla al día con `git pull origin main`. |
| `contacto-gmail-a2wd`, `legal`, `demo-boulangerie-vida`, `rediseno-galaxia` | Ya fusionadas en `main`; se pueden borrar sin perder nada. |

## Seguridad

- En el repositorio solo hay claves **públicas** (`portal/js/config.js`). Las secretas (Supabase `service_role`, Gemini, VAPID privada) viven en Supabase, nunca aquí.
- El repositorio es público: no subas datos de clientes, facturas ni contraseñas.
