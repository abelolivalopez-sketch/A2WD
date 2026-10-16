# Dominio a2wdstudio.com

## Cómo está montado

```
Visitante ──► a2wdstudio.com ──► Cloudflare (proyecto «a2wd») ──► archivos de la rama main
abelolivalopez-sketch.github.io/A2WD/… ──► GitHub Pages ──► redirige a a2wdstudio.com/…
```

- **El dominio está en Cloudflare**: allí se compró y allí están sus DNS.
- **La web la publica Cloudflare Workers**, con el proyecto **`a2wd`** conectado a este repositorio. Cada vez que entra un cambio en `main` (un merge), Cloudflare construye y publica la web en uno o dos minutos. En GitHub, cada commit de `main` lleva la comprobación **«Workers Builds: a2wd»**: en verde, ya está publicado.
- **GitHub Pages sigue activo solo para la dirección antigua.** Cualquier enlace viejo a `abelolivalopez-sketch.github.io/A2WD/…` lleva a `a2wdstudio.com/…`. Para eso existe el archivo **`CNAME`** de la raíz (una línea: `a2wdstudio.com`): no se borra.

## Cosas que hace Cloudflare y conviene saber

- **Quita el `.html` de las direcciones**: `/web.html` → `/web`. Funciona solo y los enlaces del HTML siguen llevando `.html`, que también funcionan en Live Server.
- **El service worker (`sw.js`) ya está preparado para ello** desde el 16 oct 2026. Antes, quien ya había entrado en la web veía **ERR_FAILED** al abrir cualquier página `.html`. Si algún día se toca la parte «Páginas» de `sw.js`: nunca hay que devolver una respuesta que haya llegado redirigida (`res.redirected`) a una navegación.
- **Tras publicar**, si en tu navegador sigues viendo la versión anterior, recarga con **Ctrl+F5**. Quien tenga la web o la app instalada recibe la versión nueva al volver a entrar.
- **Los archivos del repositorio quedan públicos** en el dominio: también `docs/`, `supabase/` y `herramientas/` (con GitHub Pages pasaba lo mismo). No subáis nunca contraseñas ni claves privadas.

## Publicar cambios

1. Pull request a `main` → **Merge**.
2. Esperar a que el commit de `main` tenga «Workers Builds: a2wd» en verde. También se ve en Cloudflare → **Workers & Pages → a2wd → Deployments**.
3. Abrir https://a2wdstudio.com y recargar con Ctrl+F5.

**Aviso rojo de Cloudflare en los pull requests.** En las ramas que no son `main` (`abel`, `ariel`…), «Workers Builds: a2wd» sale en rojo: Cloudflare intenta preparar una vista previa y no lo consigue. **No impide el merge ni afecta a la web publicada.** Para dejar de verlo: Cloudflare → **Workers & Pages → a2wd → Settings → Build**, y en el apartado de ramas (*Branch control*) desactivar las builds de ramas que no son de producción. Para ver por qué falla: enlace **Details** de la comprobación, en GitHub.

## DNS en Cloudflare

Cloudflare → a2wdstudio.com → **DNS → Records**.

- Los registros del dominio los creó Cloudflare al conectarlo al proyecto `a2wd` (**Workers & Pages → a2wd → Settings → Domains & Routes**). Van con la nube naranja o como tipo «Worker». **No los borréis ni los paséis a gris**: la web dejaría de verse.
- **No apuntéis el dominio a las IP de GitHub** (`185.199.x.x`): eso cambia la publicación a GitHub Pages (ver la alternativa al final).
- `www.a2wdstudio.com` también abre la web. Si queréis que lleve siempre a `a2wdstudio.com`, se crea una redirección en **Rules → Redirect Rules**.
- **SSL/TLS**: el certificado lo pone Cloudflare y no hay que hacer nada. Conviene tener activado **SSL/TLS → Edge Certificates → Always Use HTTPS**.
- Los registros que pidan otros servicios (verificación de Google o de GitHub, o el correo con el dominio si algún día lo hay) se añaden aquí.

## GitHub Pages (solo para la dirección antigua)

Repositorio A2WD → **Settings → Pages**: el *Custom domain* `a2wdstudio.com` se queda puesto.

- **Es normal** que GitHub muestre un aviso de DNS y que no deje marcar **Enforce HTTPS**: el dominio no apunta a GitHub. No hay que arreglarlo.
- Si se quitara el dominio o el `CNAME`, la dirección antigua dejaría de redirigir y enseñaría una segunda copia de la web, cosa que a Google no le gusta.
- **Recomendado**: verificar el dominio en GitHub para que ninguna otra cuenta pueda usarlo. Foto de perfil → **Settings → Pages → Add a domain** → `a2wdstudio.com`. GitHub da un registro TXT (`_github-pages-challenge-abelolivalopez-sketch`): se crea en Cloudflare (DNS → Records, «Solo DNS») y se pulsa **Verify**.

## Supabase (portal)

**Authentication → URL Configuration** (ver también `PORTAL-GUIA.md`, paso 3):
- *Site URL*: `https://a2wdstudio.com/portal/login.html`
- *Redirect URLs*: `https://a2wdstudio.com/portal/**`. Dejad unas semanas también la de github.io, para las invitaciones ya enviadas.

Las sesiones, la app instalada y los avisos van ligados a la dirección. Quien usaba el portal en github.io tiene que entrar de nuevo, reinstalar la app desde a2wdstudio.com y volver a activar los avisos.

## Google

1. [Google Search Console](https://search.google.com/search-console) → **Añadir propiedad → Dominio** → `a2wdstudio.com`. Se verifica con el registro TXT que da Google, creado en Cloudflare. Si Search Console ofrece verificar automáticamente con Cloudflare, mejor.
2. **Sitemaps** → enviar `https://a2wdstudio.com/sitemap.xml`.
3. **Inspección de URLs** → `https://a2wdstudio.com/` → **Solicitar indexación**. Repetir con `https://a2wdstudio.com/presencia-digital`, `/servicios-y-sistemas` y `/proyectos`.
4. Poned el enlace a a2wdstudio.com en todo lo que sea vuestro: Instagram, LinkedIn, perfiles de GitHub, firma del correo, Disputatio, WEB-AIRBNB y una ficha de Google Business Profile como negocio sin local (zona de servicio).

Una web nueva tarda de días a semanas en salir en Google. Cada página le indica su dirección buena con `<link rel="canonical">`, `og:url` y el JSON-LD, siempre **sin `.html`** (`https://a2wdstudio.com/web`), que es la dirección final después de la redirección de Cloudflare. Si algún día cambia el dominio, hay que cambiar esas tres cosas en todas las páginas, además de `sitemap.xml` y `robots.txt`.

## Ver los HTML antes de publicarlos

El dominio solo enseña la rama `main`. Para ver otra rama:
- **En el ordenador**: abrir la carpeta con Live Server en VS Code (lee los archivos locales).
- **Desde cualquier sitio**: `https://raw.githack.com/abelolivalopez-sketch/A2WD/abel/index.html` (cambia `abel` por la rama y la ruta por la página). Tarda unos minutos en refrescar.

Las demás webs en GitHub Pages (por ejemplo WEB-AIRBNB) siguen en `abelolivalopez-sketch.github.io/<repo>/`. Este dominio solo afecta al repositorio A2WD.

## Alternativa: publicar con GitHub Pages en vez de Cloudflare (ahora no hace falta)

Solo si algún día se quiere dejar de usar el proyecto `a2wd` de Cloudflare:
1. Cloudflare → **Workers & Pages → a2wd → Settings → Domains & Routes**: quitar `a2wdstudio.com`.
2. **DNS → Records**: crear, con la nube en **gris («Solo DNS»)**, cuatro registros A para `@` (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), cuatro AAAA (`2606:50c0:8000::153`, `…8001::153`, `…8002::153`, `…8003::153`) y un CNAME `www` → `abelolivalopez-sketch.github.io`.
3. GitHub → **Settings → Pages**: esperar a «DNS check successful» y marcar **Enforce HTTPS** (puede tardar hasta 24 h).
4. Añadir un archivo vacío **`.nojekyll`** en la raíz del repositorio. Sin él, GitHub no publica carpetas que empiezan por punto, como `.well-known/` (la app de Android la necesita).
