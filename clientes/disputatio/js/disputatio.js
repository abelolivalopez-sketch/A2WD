import { t, aplicarTextos, conectarSelectorIdioma } from "./idiomas.js";
import { leerDisputatios } from "./almacen.js";
import { pintarArticulo } from "./articulo.js";

const PAGINA_GLOBO = "index.html";
const PAGINA_DISPUTATIO = "disputatio.html";

const dom = {
  volver: document.querySelector(".volver"),
  articulo: document.querySelector(".articulo--hoja"),
  vacia: document.querySelector(".hoja__vacia"),
  nav: document.querySelector(".hoja__nav"),
  anterior: document.querySelector(".hoja__paso--anterior"),
  siguiente: document.querySelector(".hoja__paso--siguiente")
};

const estado = {
  disputatios: [],
  indice: -1
};

function idDeDireccion() {
  return decodeURIComponent(window.location.hash.slice(1));
}

function direccionDe(id) {
  return `${PAGINA_DISPUTATIO}#${encodeURIComponent(id)}`;
}

function pintarPaso(enlace, disputatio) {
  enlace.hidden = !disputatio;
  if (!disputatio) return;
  const titulo = enlace.querySelector(".hoja__paso-titulo");
  enlace.href = direccionDe(disputatio.id);
  titulo.textContent = disputatio.titulo;
  titulo.lang = disputatio.idioma || "";
}

function pintar() {
  estado.disputatios = leerDisputatios();
  estado.indice = estado.disputatios.findIndex((disputatio) => disputatio.id === idDeDireccion());
  const disputatio = estado.disputatios[estado.indice];
  dom.articulo.hidden = !disputatio;
  dom.nav.hidden = !disputatio;
  dom.vacia.hidden = Boolean(disputatio);
  dom.volver.href = disputatio ? `${PAGINA_GLOBO}#${encodeURIComponent(disputatio.id)}` : PAGINA_GLOBO;
  if (!disputatio) {
    document.title = t("tituloSitio");
    return;
  }
  pintarArticulo(dom.articulo, disputatio, { idTitulo: "titulo-disputatio", nivelTitulo: "h1" });
  pintarPaso(dom.anterior, estado.disputatios[estado.indice - 1]);
  pintarPaso(dom.siguiente, estado.disputatios[estado.indice + 1]);
  document.title = t("tituloPagina", disputatio.titulo);
}

function alCambiarDireccion() {
  pintar();
  window.scrollTo(0, 0);
  document.getElementById("titulo-disputatio")?.focus({ preventScroll: true });
}

function iniciar() {
  aplicarTextos();
  conectarSelectorIdioma();
  pintar();
  window.addEventListener("hashchange", alCambiarDireccion);
  document.addEventListener("cambio-idioma", pintar);
}

iniciar();
