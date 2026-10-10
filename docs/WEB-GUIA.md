# Guía de la web pública (rediseño galáctico)

Resumen de cómo está montada la web pública (`index.html`, `proyectos.html` y las páginas de servicio) para poder tocarla sin romper nada. El portal de clientes tiene su propia guía en `PORTAL-GUIA.md`.

## Páginas

| Página | Qué tiene |
|---|---|
| `index.html` | Hero (A2WD + Möbius), Servicios en dos pantallas, Cómo trabajamos, Nosotros y Contacto |
| `proyectos.html` | Método en cinco fases y tarjetas de proyectos (se leen de Supabase) |
| `web.html` | Servicio 01–06: diseño y desarrollo web. Cada tarjeta web de la home lleva a su bloque (`#diseno`, `#velocidad`, `#tiendas`, `#google`, `#apps`, `#mantenimiento`) |
| `software-a-medida.html` | Servicio 07: software de gestión a medida |
| `integracion-de-sistemas.html` | Servicio 08: integración de sistemas |
| `automatizacion.html` | Servicio 09: automatización de procesos |
| `inteligencia-artificial.html` | Servicio 10: inteligencia artificial aplicada |
| `datos-y-bi.html` | Servicio 11: datos y cuadros de mando |
| `cloud-y-seguridad.html` | Servicio 12: cloud y ciberseguridad |

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `assets/css/main.css` | Base: colores, contacto, pie y Rodolfo |
| `assets/css/nav.css` | Barra de navegación (dock orbital) y menú del móvil |
| `assets/css/galaxia.css` | Todo el diseño nuevo: secciones, tarjetas y sus dibujos animados |
| `assets/js/idiomas.js` | Textos de la home, de proyectos y comunes (menú, pie) en ES / FR / IT / EN |
| `assets/js/idiomas-servicios.js` | Textos de las páginas de servicio en ES / FR / IT / EN |
| `assets/css/servicio.css` | Diseño propio de las páginas de servicio |
| `assets/js/servicio.js` | Menú, pasos con línea de luz y tarjetas de las páginas de servicio |
| `assets/js/logo-pie.js` | Logotipo animado del pie (páginas de servicio) |
| `assets/js/cosmos.js` | El fondo de estrellas (canvas) |
| `assets/js/efectos.js` | Scroll suave, apariciones, cursor y botones magnéticos |
| `assets/js/home.js` | Animaciones propias de la home |
| `assets/js/proyectos.js` | Animaciones y tarjetas de `proyectos.html` |
| `vendor/` | Librerías copiadas aquí (sin CDN): GSAP 3.15, ScrollTrigger, Lenis 1.3.26 y Three.js |
| `fonts/` | Tipografías alojadas aquí: IBM Plex, Sora (titulares) y Megrim (logotipo) |

No hay empaquetador: se edita el archivo y se sube. Para verlo en local, abre la carpeta con la extensión **Live Server** de VS Code, o ejecuta `python -m http.server` y entra en `http://localhost:8000`.

## Cambiar un texto

1. Busca el texto en el HTML: tendrá un atributo `data-i18n="clave"`.
2. Abre `assets/js/idiomas.js` (o `assets/js/idiomas-servicios.js` si es una página de servicio), busca esa clave y cámbiala **en los cuatro idiomas**.

Ojo: lo que manda es el archivo de idiomas. Si solo cambias el texto en el HTML, al cargar la página se sustituye por el del archivo de idiomas y no verás el cambio. En el HTML conviene dejar también el texto en español (lo leen Google y quien no tenga JavaScript).

En francés, delante de `?`, `!`, `:` y `;` va un espacio duro, escrito `\u00a0` (por ejemplo `"Notre objectif\u00a0?"`): así el signo nunca se queda solo en la línea siguiente.

Si añades un texto nuevo, ponle `data-i18n="clave-nueva"` y añade la clave en los cuatro bloques de `idiomas.js`.

## Animar un elemento nuevo

Basta con un atributo en el HTML (lo gestiona `efectos.js`):

| Atributo | Efecto |
|---|---|
| `data-reveal` | Sube y aparece al entrar en pantalla |
| `data-reveal="palabras"` | El texto entra palabra a palabra (titulares) |
| `data-reveal="desenfoque"` | Llega borroso y se enfoca |
| `data-reveal="escalonado"` | Sus hijos entran uno detrás de otro |
| `data-reveal="linea"` | Se dibuja de izquierda a derecha |
| `data-reveal-delay="0.2"` | Retraso en segundos |
| `data-magnetic` | Botón que se deja atraer por el ratón (opcional: `data-magnetic="0.25"` para la fuerza) |
| `data-anim` | En un bloque con dibujos animados en CSS: solo se mueven cuando está en pantalla |

Las barras tipo `(02 — Servicios)` son `<div class="sec-bar">` con dos `<span>` y se animan solas.

## El fondo de estrellas

`cosmos.js` dibuja un solo canvas fijo. En la home hay muchas estrellas, nebulosa y un planeta en el hero; al salir del hero las estrellas saltan hacia arriba y las secciones quedan más oscuras y con menos estrellas. En otras páginas, el atributo `data-cosmos-oscuro="0.32"` del `<body>` dice lo oscuro que empieza el cielo (0 = como el hero, 1 = lo más oscuro).

## Accesibilidad y rendimiento

- Con «reducir movimiento» activado en el sistema no hay scroll suave, ni cursor propio, ni animaciones: todo se ve quieto.
- Con el modo ahorro de datos no se carga la Möbius 3D ni se anima el cielo.
- Los dibujos animados y el canvas se paran cuando no están en pantalla o la pestaña está oculta.
- Si se añade una sección **fijada** (`pin`) nueva, móntala en `home.js` o `proyectos.js` (se ejecutan antes que `efectos.js`).

## «Lo que hacemos» (tarjetas de servicios de la home)

- Dos bloques de seis tarjetas iguales: **01 Presencia digital** (webs) y **02 Sistemas y procesos**. Debajo, la franja «Todo, en casa — Despega con nosotros».
- La altura de las tarjetas sale del alto de la pantalla (`--cap-h` en `galaxia.css`) para que cada bloque se vea entero al 100 % de zoom.
- Al pasar el ratón, la tarjeta se amplía, aparece su descripción y la flecha se ilumina. En móvil van de dos en dos y sin descripción.
- Cada tarjeta es un enlace a su página de servicio. Los dibujos animados están dentro de cada tarjeta (`<svg class="v1">` … `v12`) y sus estilos en `galaxia.css` («Dibujos animados de las tarjetas»).

## Páginas de servicio

Todas siguen el mismo esquema: cabecera con el dibujo de su tarjeta, ¿Te suena? (problemas), Qué incluye (seis puntos), Cómo trabajamos (línea de luz), Herramientas, Preguntas frecuentes, Más servicios y llamada a Contacto. Para añadir una nueva, copia una existente, cambia los textos y sus claves (prefijo propio) en `idiomas-servicios.js`, añádela a «Más servicios» de las demás y al `sitemap.xml`.

