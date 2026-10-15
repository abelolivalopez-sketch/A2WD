import { idioma, t, formatearFecha } from "./idiomas.js";

const PATRON_ENLACE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+)/g;

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  return elemento;
}

function crearEnlace(texto, url) {
  const enlace = crearElemento("a", "", texto);
  enlace.href = url;
  enlace.target = "_blank";
  enlace.rel = "noopener";
  return enlace;
}

function lineaConEnlaces(linea) {
  const nodos = [];
  let desde = 0;
  for (const coincidencia of linea.matchAll(PATRON_ENLACE)) {
    const [completo, texto, url, suelta] = coincidencia;
    if (coincidencia.index > desde) nodos.push(document.createTextNode(linea.slice(desde, coincidencia.index)));
    nodos.push(crearEnlace(texto || suelta, url || suelta));
    desde = coincidencia.index + completo.length;
  }
  if (desde < linea.length) nodos.push(document.createTextNode(linea.slice(desde)));
  return nodos;
}

function crearParrafo(bloque) {
  const parrafo = document.createElement("p");
  bloque.split("\n").forEach((linea, posicion) => {
    if (posicion) parrafo.append(document.createElement("br"));
    parrafo.append(...lineaConEnlaces(linea));
  });
  return parrafo;
}

function crearImagen(imagen) {
  const figura = crearElemento("figure", "articulo__imagen");
  const foto = document.createElement("img");
  foto.src = imagen.src;
  foto.alt = imagen.descripcion || "";
  figura.append(foto);
  return figura;
}

function crearDatos(disputatio) {
  const datos = crearElemento("p", "articulo__datos");
  const fecha = crearElemento("time", "articulo__fecha", formatearFecha(disputatio.fecha));
  fecha.dateTime = disputatio.fecha || "";
  datos.lang = idioma();
  datos.append(crearElemento("span", "articulo__lugar", [disputatio.ciudad, disputatio.pais].filter(Boolean).join(", ")), fecha);
  if (Number.isFinite(disputatio.lat) && Number.isFinite(disputatio.lng)) {
    datos.append(crearElemento("span", "articulo__coordenadas", t("coordenadasGrados", disputatio.lat, disputatio.lng)));
  }
  return datos;
}

function crearListaEnlaces(enlaces) {
  const bloque = crearElemento("section", "articulo__enlaces");
  const titulo = crearElemento("h3", "articulo__enlaces-titulo", t("enlaces"));
  const lista = document.createElement("ul");
  titulo.lang = idioma();
  enlaces.forEach((enlace) => {
    const elemento = document.createElement("li");
    elemento.append(crearEnlace(enlace.texto, enlace.url));
    lista.append(elemento);
  });
  bloque.append(titulo, lista);
  return bloque;
}

export function urlValida(url) {
  try {
    return ["https:", "http:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function textoEnParrafos(texto) {
  return String(texto || "")
    .split(/\n\s*\n/)
    .map((bloque) => bloque.trim())
    .filter(Boolean)
    .map(crearParrafo);
}

export function pintarArticulo(contenedor, disputatio, { idTitulo = "", nivelTitulo = "h2" } = {}) {
  const cabecera = crearElemento("header", "articulo__cabecera");
  const rotulo = crearElemento("div", "articulo__rotulo");
  const titulo = crearElemento(nivelTitulo, "articulo__titulo", disputatio.titulo);
  const cuerpo = crearElemento("div", "articulo__cuerpo");
  const texto = crearElemento("div", "articulo__texto");
  const enlaces = (disputatio.enlaces || []).filter((enlace) => enlace.texto && urlValida(enlace.url));
  const conImagen = Boolean(disputatio.imagen?.src);
  if (idTitulo) titulo.id = idTitulo;
  titulo.tabIndex = -1;
  rotulo.append(titulo);
  if (disputatio.participantes) rotulo.append(crearElemento("p", "articulo__participantes", disputatio.participantes));
  rotulo.append(crearDatos(disputatio));
  if (conImagen) cabecera.append(crearImagen(disputatio.imagen));
  cabecera.append(rotulo);
  texto.append(...textoEnParrafos(disputatio.texto));
  cuerpo.append(texto);
  if (enlaces.length) cuerpo.append(crearListaEnlaces(enlaces));
  contenedor.lang = disputatio.idioma || idioma();
  contenedor.classList.toggle("articulo--con-imagen", conImagen);
  contenedor.replaceChildren(cabecera, cuerpo);
  return titulo;
}
