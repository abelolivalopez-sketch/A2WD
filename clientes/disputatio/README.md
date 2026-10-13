# Disputatio · globo de disputatio

Tres páginas, en francés e inglés, con la identidad de Disputatio: fondo negro, verde flúor `#00FA5A`, crema `#FFFFC1`, el logo del círculo verde y fotos en blanco y negro.

- `index.html`: el globo (verde con continentes negros y sombra de semitono). Cada ciudad es un punto con su nombre; si en una ciudad hay varios disputatio, el punto lleva el número y al pulsarlo se abre una tarjeta con la lista. Si solo hay uno, se pasa directamente a su página.
- `disputatio.html#id`: la página de cada publicación. Cabecera negra con el título grande en verde (si hay foto, la foto en blanco y negro detrás, como en los carteles de Instagram), intervenientes, lugar, fecha y coordenadas; debajo el texto sobre crema, los enlaces, el anterior y el siguiente y «Retour au globe», que vuelve al globo centrado en esa ciudad.
- `creation.html`: el espacio de creación. **No está enlazado desde la web pública**: se entra escribiendo la dirección (`.../creation.html`). Se pulsa «Ajouter un disputatio», se planta el punto en el globo y se escribe el artículo (idioma, título, intervenientes, ciudad, país, fecha, imagen, texto con enlaces y lista de enlaces). Se puede guardar como borrador, publicar, editar y borrar.

**Todavía no hay cuentas ni base de datos.** Lo que se crea se guarda solo en el navegador de quien lo crea (modo demo). Cuando haya base de datos, solo cambia `js/almacen.js`.

Para verla en local, desde la raíz del repositorio: `python -m http.server` y abre `http://localhost:8000/clientes/disputatio/` (con doble clic no carga: los módulos y el mapa necesitan servidor).

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html`, `disputatio.html`, `creation.html` | Estructura de cada página |
| `css/estilos.css` | Tipografías, colores (en `:root`) y todo lo común: globo, puntos, tarjeta de ciudad, pie, idiomas, artículo |
| `css/disputatio.css` | Solo la página de publicación |
| `css/creacion.css` | Solo el espacio de creación: lista, pasos, formulario, botones, avisos |
| `js/idiomas.js` | Todos los textos en francés e inglés y el cambio de idioma |
| `js/ejemplos.js` | Los disputatio de ejemplo (dos en París y uno en Dakar) |
| `js/almacen.js` | Leer, guardar y borrar disputatio. Hoy usa el navegador; mañana, la base de datos |
| `js/articulo.js` | Pinta un disputatio (página de publicación y vista previa) y convierte los enlaces del texto |
| `js/globo.js` | El globo 3D: colores, semitono, giro, zoom, puntos y punto nuevo |
| `js/sitio.js` | El globo público: agrupa por ciudad y abre la tarjeta |
| `js/disputatio.js` | La página de publicación |
| `js/creacion.js` | El espacio de creación |
| `img/logo.png` | Logo de Disputatio (512 px). Si llega el original en SVG, sustituirlo |
| `img/tierra-2k.png`, `img/tierra-4k.png` | Máscara del mapa: blanco el mar, negro la tierra (el 4k solo en pantallas grandes). Los colores se ponen en `js/globo.js` |
| `fuentes/` | Archivo (rótulos y texto) e Instrument Serif (títulos), licencia OFL |
| `vendor/three-r128.min.js` | three.js |
| `herramientas/generar-mapa.py` | Genera la máscara del mapa |

En cada archivo JS van primero las importaciones y lo que se declara (ajustes, elementos de la página, estado), después las funciones y al final el arranque.

## Un disputatio

```js
{
  id: "paris-mythe-2026",
  idioma: "fr",
  estado: "publicado",
  titulo: "Le mythe est-il encore un outil de compréhension du monde ?",
  participantes: "Avec Julien d'Huy, docteur en histoire et spécialiste de mythologie comparée",
  ciudad: "Paris",
  pais: "France",
  fecha: "2026-06-14",
  lat: 48.8836,
  lng: 2.3492,
  texto: "Primer párrafo.\n\nSegundo párrafo con un [enlace](https://...).",
  enlaces: [{ texto: "Disputatio sur Instagram", url: "https://www.instagram.com/_disputatio/" }],
  imagen: { src: "...", descripcion: "..." }
}
```

`estado` es `publicado` o `borrador` (los borradores solo se ven en el espacio de creación). `participantes` e `imagen` son opcionales; la imagen se muestra siempre en blanco y negro. La página de cada disputatio publicado es `disputatio.html#` más su `id`. En el globo, los disputatio con la misma ciudad y el mismo país comparten punto.

## Redes sociales

En el pie van los nombres «Instagram», «Facebook» y «TikTok» escritos en verde, sin los logos de las marcas, para no depender de sus normas de uso de marca.

## Colores y mapa

Los colores de la web están en `:root` de `css/estilos.css`; los del globo, en `CONFIG` de `js/globo.js` (`colorTierra`, `colorMar`, `pasoSemitono`, `coberturaSemitono`).

Para regenerar la máscara del mapa hacen falta los contornos de Natural Earth (`ne_50m_land.geojson` y `ne_50m_admin_0_countries.geojson`, dominio público) en una carpeta:

```bash
python herramientas/generar-mapa.py ruta/a/geojson
```

## Pendiente

- Cuentas de autores (solo las que demos de alta) y base de datos, para que Disputatio publique sin pasar por nosotros.
- Logo original en SVG.
- Enlaces de Facebook y TikTok: ahora apuntan a `#`. Se cambia el `href` de los enlaces «Facebook» y «TikTok» del pie en `index.html` y `disputatio.html`. Instagram ya apunta a `_disputatio`.
- Fotos en blanco y negro de cada disputatio.
- Textos: el de «Le mythe…» está redactado a partir del post de Instagram; los de Château Rouge y Dakar son de ejemplo.
- Dominio donde se publicará.
