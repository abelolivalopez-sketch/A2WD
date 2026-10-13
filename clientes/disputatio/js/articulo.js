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

function crearOrnamento() {
  const ornamento = crearElemento("div", "ornamento articulo__ornamento");
  ornamento.setAttribute("aria-hidden", "true");
  ornamento.append(document.createElement("span"));
  return ornamento;
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
  const lugar = crearElemento("p", "articulo__lugar", [disputatio.ciudad, disputatio.pais].filter(Boolean).join(", "));
  const titulo = crearElemento(nivelTitulo, "articulo__titulo", disputatio.titulo);
  const fecha = crearElemento("time", "articulo__fecha", formatearFecha(disputatio.fecha));
  const texto = crearElemento("div", "articulo__texto");
  const enlaces = (disputatio.enlaces || []).filter((enlace) => enlace.texto && urlValida(enlace.url));
  const partes = [lugar, titulo, fecha];
  if (idTitulo) titulo.id = idTitulo;
  titulo.tabIndex = -1;
  fecha.dateTime = disputatio.fecha || "";
  fecha.lang = idioma();
  if (Number.isFinite(disputatio.lat) && Number.isFinite(disputatio.lng)) {
    const coordenadas = crearElemento("span", "articulo__coordenadas", t("coordenadasAntiguas", disputatio.lat, disputatio.lng));
    coordenadas.lang = idioma();
    partes.push(coordenadas);
  }
  partes.push(crearOrnamento());
  texto.append(...textoEnParrafos(disputatio.texto));
  if (disputatio.imagen?.src) partes.push(crearImagen(disputatio.imagen));
  partes.push(texto);
  if (enlaces.length) partes.push(crearListaEnlaces(enlaces));
  contenedor.lang = disputatio.idioma || idioma();
  contenedor.replaceChildren(...partes);
  return titulo;
}
