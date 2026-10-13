# Disputatio · globo de disputatio

Tres páginas, en francés e inglés, con aspecto de mapa antiguo grabado sobre papel envejecido:

- `index.html`: el globo. Cada punto es una disputatio; al pulsarlo, el globo gira hasta él y se pasa a su página.
- `disputatio.html#id`: la página de cada publicación, como una hoja de libro antiguo (lugar, título, fecha, coordenadas, imagen, texto con letra capital y enlaces), con la anterior y la siguiente y «Retour au globe», que vuelve al globo centrado en ese punto.
- `creation.html`: el espacio de creación. Se pulsa «Ajouter une disputatio», se planta el punto en el globo y se escribe el artículo (idioma, título, ciudad, país, fecha, imagen, texto con enlaces y lista de enlaces). Se puede guardar como borrador, publicar, editar y borrar. Se llega desde el enlace «Espace de création» del pie del globo.

**Todavía no hay cuentas ni base de datos.** Lo que se crea se guarda solo en el navegador de quien lo crea (modo demo). Cuando haya base de datos, solo cambia `js/almacen.js`.

Para verla en local, desde la raíz del repositorio: `python -m http.server` y abre `http://localhost:8000/clientes/disputatio/` (con doble clic no carga: los módulos y el mapa necesitan servidor).

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html`, `disputatio.html`, `creation.html` | Estructura de cada página |
| `css/estilos.css` | Tipografías, colores (en `:root`) y todo lo común: papel, marco, globo, puntos, pie, idiomas, artículo |
| `css/disputatio.css` | Solo la página de publicación |
| `css/creacion.css` | Solo el espacio de creación: lista, pasos, formulario, botones, avisos |
| `js/idiomas.js` | Todos los textos en francés e inglés y el cambio de idioma |
| `js/ejemplos.js` | Los disputatio de ejemplo (París y Dakar) |
| `js/almacen.js` | Leer, guardar y borrar disputatio. Hoy usa el navegador; mañana, la base de datos |
| `js/articulo.js` | Pinta una disputatio (página de publicación y vista previa) y convierte los enlaces del texto |
| `js/globo.js` | El globo 3D: sombreado de grabado, giro, zoom, puntos y punto nuevo |
| `js/sitio.js` | El globo público |
| `js/disputatio.js` | La página de publicación |
| `js/creacion.js` | El espacio de creación |
| `img/tierra-2k.jpg`, `img/tierra-4k.jpg` | Mapa del globo (el 4k solo en pantallas grandes) |
| `img/papel.jpg` | Textura del papel de fondo (se repite) |
| `img/logo.svg` | Logo provisional, a sustituir por el de Disputatio |
| `img/redes/` | Iconos de Instagram, Facebook y TikTok (ahora provisionales, con la inicial) |
| `fuentes/` | IM Fell English (rótulos) y EB Garamond (texto), licencia OFL |
| `vendor/three-r128.min.js` | three.js |
| `herramientas/generar-mapa.py` | Genera el mapa y el papel |

En cada archivo JS van primero las importaciones y lo que se declara (ajustes, elementos de la página, estado), después las funciones y al final el arranque.

## Una disputatio

```js
{
  id: "paris-2025",
  idioma: "fr",
  estado: "publicado",
  titulo: "Première disputatio à la Sorbonne",
  ciudad: "Paris",
  pais: "France",
  fecha: "2025-02-21",
  lat: 48.857,
  lng: 2.352,
  texto: "Primer párrafo.\n\nSegundo párrafo con un [enlace](https://...).",
  enlaces: [{ texto: "Vidéo du débat", url: "https://..." }],
  imagen: { src: "...", descripcion: "..." }
}
```

`estado` es `publicado` o `borrador` (los borradores solo se ven en el espacio de creación). `imagen` es opcional. La página de cada disputatio publicada es `disputatio.html#` más su `id`.

## Regenerar el mapa

Necesita los contornos de Natural Earth (`ne_50m_land.geojson` y `ne_50m_admin_0_countries.geojson`, dominio público) en una carpeta:

```bash
python herramientas/generar-mapa.py ruta/a/geojson
```

Al principio del script están los colores (`COLORES`) y los rótulos latinos del globo (`ROTULOS`: texto, longitud, latitud y estilo). Usa las fuentes de `fuentes/` y deja los archivos en `img/`.

## Pendiente

- Cuentas de autores (solo las que demos de alta) y base de datos.
- Logo real de Disputatio y enlaces de Instagram, Facebook y TikTok (ahora apuntan a `#`).
- Iconos oficiales de las redes: descargar la versión monocroma (SVG o PNG con fondo transparente) de cada marca y guardarla en `img/redes/` con el mismo nombre (`instagram.svg`, `facebook.svg`, `tiktok.svg`; si es PNG, cambiar la extensión en `css/estilos.css`). El CSS solo usa la silueta y la pinta en blanco translúcido.
- Disputatio reales: los dos actuales (París y Dakar) son de ejemplo.
- Dominio donde se publicará.
