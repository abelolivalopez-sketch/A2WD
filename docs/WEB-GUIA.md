# Guía de la web pública (rediseño galáctico)

Resumen de cómo está montada la web pública (`index.html` y `proyectos.html`) para poder tocarla sin romper nada. El portal de clientes tiene su propia guía en `PORTAL-GUIA.md`.

## Páginas

| Página | Qué tiene |
|---|---|
| `index.html` | Hero (A2WD + Möbius), Servicios en dos pantallas, Cómo trabajamos, Nosotros y Contacto |
| `proyectos.html` | Método en cinco fases y tarjetas de proyectos (se leen de Supabase) |

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `assets/css/main.css` | Base: colores, contacto, pie y Rodolfo |
| `assets/css/nav.css` | Barra de navegación (dock orbital) y menú del móvil |
| `assets/css/galaxia.css` | Todo el diseño nuevo: secciones, tarjetas y sus dibujos animados |
| `assets/js/idiomas.js` | Todos los textos en ES / FR / IT / EN |
| `assets/js/cosmos.js` | El fondo de estrellas (canvas) |
| `assets/js/efectos.js` | Scroll suave, apariciones, cursor y botones magnéticos |
| `assets/js/home.js` | Animaciones propias de la home |
| `assets/js/proyectos.js` | Animaciones y tarjetas de `proyectos.html` |
| `vendor/` | Librerías copiadas aquí (sin CDN): GSAP 3.15, ScrollTrigger, Lenis 1.3.26 y Three.js |
| `fonts/` | Tipografías alojadas aquí: IBM Plex, Sora (titulares) y Megrim (logotipo) |

No hay empaquetador: se edita el archivo y se sube. Para verlo en local, abre la carpeta con la extensión **Live Server** de VS Code, o ejecuta `python -m http.server` y entra en `http://localhost:8000`.

## Cambiar un texto

1. Busca el texto en el HTML: tendrá un atributo `data-i18n="clave"`.
2. Abre `assets/js/idiomas.js`, busca esa clave y cámbiala **en los cuatro idiomas**.

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
