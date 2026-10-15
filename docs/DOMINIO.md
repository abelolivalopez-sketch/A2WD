# Dominio a2wdstudio.com

La web se sirve con GitHub Pages desde la rama `main` y el dominio está en Cloudflare. El archivo `CNAME` de la raíz (una sola línea: `a2wdstudio.com`) le dice a GitHub qué dominio usar; no hay que borrarlo ni moverlo.

## 1. DNS en Cloudflare

Cloudflare → a2wdstudio.com → **DNS → Records**. Borra los registros de `a2wdstudio.com` y `www` que haya y crea estos, todos con la nube en **gris («Solo DNS»)**:

| Tipo | Nombre | Contenido |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `abelolivalopez-sketch.github.io` |

Con la nube naranja (proxy) GitHub no ve su propio servidor, no puede crear el certificado HTTPS y la casilla «Enforce HTTPS» no se activa. Además Cloudflare guarda copias de los CSS y JS y, tras subir cambios, se pueden ver mezcladas versiones viejas y nuevas.

En **SSL/TLS → Overview**, el modo «Full». Nunca «Flexible».

## 2. GitHub Pages

1. Repositorio A2WD → **Settings → Pages** → *Custom domain*: `a2wdstudio.com` → **Save**.
2. Esperar a que salga «DNS check successful» (minutos, a veces horas).
3. Marcar **Enforce HTTPS**. Puede tardar hasta 24 h en dejarse marcar mientras GitHub crea el certificado.
4. Verificar el dominio (evita que otra cuenta de GitHub lo use): foto de perfil → **Settings → Pages → Add a domain** → `a2wdstudio.com`. GitHub da un registro TXT (`_github-pages-challenge-abelolivalopez-sketch`); se crea en Cloudflare y se pulsa **Verify**.

Comprobación final, en una ventana privada:
- `https://abelolivalopez-sketch.github.io/A2WD/` → lleva a `https://a2wdstudio.com/` (con **https**).
- `http://a2wdstudio.com` → lleva a `https://a2wdstudio.com`.
- `https://www.a2wdstudio.com` → lleva a `https://a2wdstudio.com`.

## 3. Supabase (portal)

**Authentication → URL Configuration** (ver también `PORTAL-GUIA.md`, paso 3):
- *Site URL*: `https://a2wdstudio.com/portal/login.html`
- *Redirect URLs*: `https://a2wdstudio.com/portal/**`; dejar unas semanas la de github.io.

Las sesiones, la app instalada y los avisos van ligados a la dirección: quien usaba el portal en github.io tiene que entrar de nuevo, reinstalar la app desde a2wdstudio.com y volver a activar los avisos.

## 4. Google

1. [Google Search Console](https://search.google.com/search-console) → **Añadir propiedad → Dominio** → `a2wdstudio.com`. Verificar con el registro TXT que da Google, creándolo en Cloudflare (si Search Console ofrece verificar automáticamente con Cloudflare, mejor).
2. **Sitemaps** → enviar `https://a2wdstudio.com/sitemap.xml`.
3. **Inspección de URLs** → `https://a2wdstudio.com/` → **Solicitar indexación**. Repetir con `presencia-digital.html`, `servicios-y-sistemas.html` y `proyectos.html`.
4. Poner el enlace a a2wdstudio.com en todo lo que sea vuestro: Instagram, LinkedIn, perfiles de GitHub, firma del correo, Disputatio, WEB-AIRBNB, y una ficha de Google Business Profile como negocio sin local (zona de servicio).

Una web nueva tarda de días a semanas en salir. Las páginas indican a Google su dirección buena con `<link rel="canonical">`, `og:url` y el JSON-LD; si algún día cambia el dominio, hay que cambiar esas tres cosas en todas las páginas, más `sitemap.xml` y `robots.txt`.

## 5. Ver los HTML antes de publicarlos

El dominio solo enseña la rama `main`. Para ver otra rama:
- En el ordenador: abrir la carpeta con Live Server en VS Code (lee los archivos locales).
- Desde cualquier sitio: `https://raw.githack.com/abelolivalopez-sketch/A2WD/abel/index.html` (cambia `abel` por la rama y la ruta por la página). Tarda unos minutos en refrescar.

Las demás webs en GitHub Pages (por ejemplo WEB-AIRBNB) siguen en `abelolivalopez-sketch.github.io/<repo>/`; este dominio solo afecta al repositorio A2WD.
