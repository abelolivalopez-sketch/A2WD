import { aplicarTextos, conectarSelectorIdioma } from "./idiomas.js";
import { leerDisputatios } from "./almacen.js";
import { iniciarGlobo, ponerMarcadores, marcarActivo, enfocar, mirarA } from "./globo.js";

const PAGINA_DISPUTATIO = "disputatio.html";
const ESPERA_VIAJE = 650;

const dom = {
  lienzo: document.querySelector(".escenario__lienzo"),
  capa: document.querySelector(".escenario__marcadores"),
  lista: document.querySelector(".lista-disputatios")
};

const estado = {
  disputatios: [],
  activa: null,
  saliendo: false,
  sin3d: false
};

const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");

function direccionDe(id) {
  return `${PAGINA_DISPUTATIO}#${encodeURIComponent(id)}`;
}

function etiquetaMarcador(disputatio) {
  return `${disputatio.titulo}, ${disputatio.ciudad}`;
}

function buscar(id) {
  return estado.disputatios.find((disputatio) => disputatio.id === id) || null;
}

function recordarEnDireccion(id) {
  const base = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", `${base}#${encodeURIComponent(id)}`);
}

function irA(id) {
  const disputatio = buscar(id);
  if (!disputatio || estado.saliendo) return;
  estado.saliendo = true;
  estado.activa = id;
  marcarActivo(id);
  recordarEnDireccion(id);
  if (movimientoReducido.matches) return window.location.assign(direccionDe(id));
  enfocar(disputatio);
  document.body.classList.add("saliendo");
  window.setTimeout(() => window.location.assign(direccionDe(id)), ESPERA_VIAJE);
}

function mostrarDesdeDireccion() {
  const disputatio = buscar(decodeURIComponent(window.location.hash.slice(1)));
  if (!disputatio) return;
  estado.activa = disputatio.id;
  marcarActivo(disputatio.id);
  mirarA(disputatio);
}

function pintarMarcadores() {
  ponerMarcadores(estado.disputatios, { alPulsar: irA, etiqueta: etiquetaMarcador });
  if (estado.activa) marcarActivo(estado.activa);
}

function crearOpcionLista(disputatio) {
  const elemento = document.createElement("li");
  const enlace = document.createElement("a");
  const lugar = document.createElement("span");
  const titulo = document.createElement("span");
  enlace.href = direccionDe(disputatio.id);
  enlace.lang = disputatio.idioma || "";
  lugar.className = "lista-disputatios__lugar";
  lugar.textContent = disputatio.ciudad;
  titulo.className = "lista-disputatios__titulo";
  titulo.textContent = disputatio.titulo;
  enlace.append(lugar, titulo);
  elemento.append(enlace);
  return elemento;
}

function mostrarLista() {
  estado.sin3d = true;
  dom.lienzo.hidden = true;
  dom.capa.hidden = true;
  dom.lista.hidden = false;
  dom.lista.replaceChildren(...estado.disputatios.map(crearOpcionLista));
  document.querySelector(".marca__entrada").dataset.t = "entradaLista";
  aplicarTextos();
}

function alVolverAPagina(evento) {
  if (!evento.persisted) return;
  estado.saliendo = false;
  document.body.classList.remove("saliendo");
  mostrarDesdeDireccion();
}

function alCambiarIdioma() {
  if (!estado.sin3d) pintarMarcadores();
}

function conectar() {
  window.addEventListener("pageshow", alVolverAPagina);
  window.addEventListener("hashchange", mostrarDesdeDireccion);
  document.addEventListener("cambio-idioma", alCambiarIdioma);
}

async function iniciar() {
  aplicarTextos();
  conectarSelectorIdioma();
  conectar();
  estado.disputatios = leerDisputatios();
  try {
    await iniciarGlobo({ lienzo: dom.lienzo, capa: dom.capa, giroAutomatico: true });
    pintarMarcadores();
  } catch {
    mostrarLista();
  }
  document.body.classList.remove("cargando");
  mostrarDesdeDireccion();
}

iniciar();
