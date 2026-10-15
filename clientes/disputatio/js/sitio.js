import { t, aplicarTextos, conectarSelectorIdioma, formatearFecha } from "./idiomas.js";
import { leerDisputatios } from "./almacen.js";
import { iniciarGlobo, ponerMarcadores, marcarActivo, enfocar, mirarA, fijarHueco, fijarGiroAutomatico, botonDeMarcador } from "./globo.js";

const PAGINA_DISPUTATIO = "disputatio.html";
const ESPERA_VIAJE = 650;
const ANCHO_ESCRITORIO = 760;
const ESPACIO_MARCA = 12;

const dom = {
  lienzo: document.querySelector(".escenario__lienzo"),
  capa: document.querySelector(".escenario__marcadores"),
  lista: document.querySelector(".lista-disputatios"),
  marca: document.querySelector(".marca__enlace"),
  ciudad: document.querySelector(".ciudad"),
  ciudadNombre: document.querySelector(".ciudad__nombre"),
  ciudadCantidad: document.querySelector(".ciudad__cantidad"),
  ciudadLista: document.querySelector(".ciudad__lista"),
  ciudadCerrar: document.querySelector(".ciudad__cerrar")
};

const estado = {
  disputatios: [],
  ciudades: [],
  abierta: null,
  saliendo: false,
  sin3d: false
};

const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");

function direccionDe(id) {
  return `${PAGINA_DISPUTATIO}#${encodeURIComponent(id)}`;
}

function claveCiudad(disputatio) {
  return `${disputatio.ciudad}|${disputatio.pais}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function media(valores) {
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}

function agrupar(disputatios) {
  const grupos = new Map();
  disputatios.forEach((disputatio) => {
    const clave = claveCiudad(disputatio);
    if (!grupos.has(clave)) grupos.set(clave, { id: clave, ciudad: disputatio.ciudad, pais: disputatio.pais, disputatios: [] });
    grupos.get(clave).disputatios.push(disputatio);
  });
  return [...grupos.values()].map((grupo) => ({
    ...grupo,
    disputatios: [...grupo.disputatios].reverse(),
    lat: media(grupo.disputatios.map((disputatio) => disputatio.lat)),
    lng: media(grupo.disputatios.map((disputatio) => disputatio.lng))
  }));
}

function ciudadPorId(id) {
  return estado.ciudades.find((ciudad) => ciudad.id === id) || null;
}

function ciudadDe(idDisputatio) {
  return estado.ciudades.find((ciudad) => ciudad.disputatios.some((disputatio) => disputatio.id === idDisputatio)) || null;
}

function etiquetaMarcador(ciudad) {
  const [primera] = ciudad.disputatios;
  return ciudad.disputatios.length > 1 ? t("etiquetaCiudad", ciudad.ciudad, ciudad.disputatios.length) : `${primera.titulo}, ${ciudad.ciudad}`;
}

function recordarEnDireccion(id) {
  const base = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", `${base}#${encodeURIComponent(id)}`);
}

function calcularHueco() {
  if (dom.ciudad.hidden) return {};
  const caja = dom.ciudad.getBoundingClientRect();
  if (window.innerWidth >= ANCHO_ESCRITORIO) return { derecha: Math.max(window.innerWidth - caja.left, 0) };
  return { arriba: dom.marca.getBoundingClientRect().bottom + ESPACIO_MARCA, abajo: Math.max(window.innerHeight - caja.top, 0) };
}

function actualizarHueco() {
  if (!estado.sin3d) fijarHueco(calcularHueco());
}

function irA(id) {
  const ciudad = ciudadDe(id);
  if (!ciudad || estado.saliendo) return;
  estado.saliendo = true;
  marcarActivo(ciudad.id);
  recordarEnDireccion(id);
  if (movimientoReducido.matches) return window.location.assign(direccionDe(id));
  enfocar(ciudad);
  document.body.classList.add("saliendo");
  window.setTimeout(() => window.location.assign(direccionDe(id)), ESPERA_VIAJE);
}

function alPulsarEnlace(evento, id) {
  if (evento.button || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  irA(id);
}

function crearOpcionCiudad(disputatio) {
  const elemento = document.createElement("li");
  const enlace = document.createElement("a");
  const fecha = document.createElement("time");
  const titulo = document.createElement("span");
  enlace.className = "ciudad__enlace";
  enlace.href = direccionDe(disputatio.id);
  fecha.className = "ciudad__fecha";
  fecha.dateTime = disputatio.fecha;
  fecha.textContent = formatearFecha(disputatio.fecha);
  titulo.className = "ciudad__titulo";
  titulo.lang = disputatio.idioma || "";
  titulo.textContent = disputatio.titulo;
  enlace.append(fecha, titulo);
  enlace.addEventListener("click", (evento) => alPulsarEnlace(evento, disputatio.id));
  elemento.append(enlace);
  return elemento;
}

function pintarCiudad(ciudad) {
  dom.ciudadNombre.textContent = ciudad.ciudad;
  dom.ciudadCantidad.textContent = [ciudad.pais, t("cantidad", ciudad.disputatios.length)].filter(Boolean).join(" · ");
  dom.ciudadLista.replaceChildren(...ciudad.disputatios.map(crearOpcionCiudad));
}

function abrirCiudad(ciudad, { conFoco = true } = {}) {
  estado.abierta = ciudad;
  pintarCiudad(ciudad);
  dom.ciudad.hidden = false;
  document.body.classList.add("con-ciudad");
  marcarActivo(ciudad.id);
  mirarA(ciudad);
  fijarGiroAutomatico(false);
  actualizarHueco();
  if (conFoco) dom.ciudadNombre.focus({ preventScroll: true });
}

function cerrarCiudad() {
  if (!estado.abierta) return;
  const devolverFoco = dom.ciudad.contains(document.activeElement);
  const { id } = estado.abierta;
  estado.abierta = null;
  dom.ciudad.hidden = true;
  document.body.classList.remove("con-ciudad");
  marcarActivo(null);
  fijarGiroAutomatico(true);
  actualizarHueco();
  if (devolverFoco) botonDeMarcador(id)?.focus({ preventScroll: true });
}

function alPulsarCiudad(id) {
  const ciudad = ciudadPorId(id);
  if (!ciudad) return;
  if (ciudad.disputatios.length === 1) return irA(ciudad.disputatios[0].id);
  if (estado.abierta?.id === id) return cerrarCiudad();
  abrirCiudad(ciudad);
}

function mostrarDesdeDireccion() {
  const ciudad = ciudadDe(decodeURIComponent(window.location.hash.slice(1)));
  if (!ciudad || estado.sin3d) return;
  if (ciudad.disputatios.length > 1) return abrirCiudad(ciudad, { conFoco: false });
  marcarActivo(ciudad.id);
  mirarA(ciudad);
}

function pintarMarcadores() {
  ponerMarcadores(estado.ciudades, {
    alPulsar: alPulsarCiudad,
    etiqueta: etiquetaMarcador,
    clase: () => "marcador--ciudad",
    cantidad: (ciudad) => ciudad.disputatios.length
  });
  if (estado.abierta) marcarActivo(estado.abierta.id);
}

function crearOpcionLista(disputatio) {
  const elemento = document.createElement("li");
  const enlace = document.createElement("a");
  const lugar = document.createElement("span");
  const titulo = document.createElement("span");
  enlace.href = direccionDe(disputatio.id);
  enlace.lang = disputatio.idioma || "";
  lugar.className = "lista-disputatios__lugar";
  lugar.textContent = `${disputatio.ciudad} · ${formatearFecha(disputatio.fecha)}`;
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
  dom.lista.replaceChildren(...[...estado.disputatios].reverse().map(crearOpcionLista));
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
  if (estado.sin3d) return mostrarLista();
  pintarMarcadores();
  if (estado.abierta) pintarCiudad(estado.abierta);
}

function alTeclado(evento) {
  if (evento.key === "Escape") cerrarCiudad();
}

function conectar() {
  window.addEventListener("pageshow", alVolverAPagina);
  window.addEventListener("hashchange", mostrarDesdeDireccion);
  window.addEventListener("keydown", alTeclado);
  window.addEventListener("resize", actualizarHueco);
  document.addEventListener("cambio-idioma", alCambiarIdioma);
  dom.ciudadCerrar.addEventListener("click", cerrarCiudad);
  new ResizeObserver(actualizarHueco).observe(dom.ciudad);
}

async function iniciar() {
  aplicarTextos();
  conectarSelectorIdioma();
  conectar();
  estado.disputatios = leerDisputatios();
  estado.ciudades = agrupar(estado.disputatios);
  try {
    await iniciarGlobo({ lienzo: dom.lienzo, capa: dom.capa, alTocar: cerrarCiudad, giroAutomatico: true });
    pintarMarcadores();
  } catch {
    mostrarLista();
  }
  document.body.classList.remove("cargando");
  mostrarDesdeDireccion();
}

iniciar();
