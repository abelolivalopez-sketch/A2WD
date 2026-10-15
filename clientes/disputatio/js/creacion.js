import { t, idioma, aplicarTextos, conectarSelectorIdioma, formatearFecha } from "./idiomas.js";
import { leerDisputatios, buscarDisputatio, crearId, guardarDisputatio, borrarDisputatio, vaciarLocal, exportarJSON } from "./almacen.js";
import { pintarArticulo, urlValida } from "./articulo.js";
import { iniciarGlobo, ponerMarcadores, marcarActivo, enfocar, mirarA, reposar, fijarHueco, ponerPuntoNuevo, lugarEn } from "./globo.js";

const ANCHO_ESCRITORIO = 760;
const LADO_MAXIMO_IMAGEN = 1400;
const CALIDAD_IMAGEN = 0.82;
const DURACION_AVISO = 6000;
const PATRON_ENLACE_EN_TEXTO = /\[[^\]\n]+\]\(([^)\n]*)\)/g;
const CAMPOS_OBLIGATORIOS = [
  ["titulo", "errorTitulo"],
  ["ciudad", "errorCiudad"],
  ["pais", "errorPais"],
  ["fecha", "errorFecha"],
  ["texto", "errorTexto"]
];

const dom = {
  lienzo: document.querySelector(".escenario__lienzo"),
  capa: document.querySelector(".escenario__marcadores"),
  panel: document.querySelector(".panel--creacion"),
  vistas: document.querySelectorAll(".vista"),
  propias: document.querySelector(".propias"),
  vacio: document.querySelector(".propias__vacio"),
  sin3d: document.querySelector('[data-error="sin3d"]'),
  nueva: document.querySelector('[data-accion="nueva"]'),
  continuar: document.querySelector('[data-accion="continuar"]'),
  coordenadas: document.querySelectorAll(".coordenadas"),
  titulosEdicion: document.querySelectorAll("[data-titulo-edicion]"),
  modos: document.querySelectorAll("[data-modo]"),
  formulario: document.querySelector(".formulario"),
  previa: document.querySelector(".articulo--previa"),
  campos: {
    titulo: document.getElementById("campo-titulo"),
    participantes: document.getElementById("campo-participantes"),
    ciudad: document.getElementById("campo-ciudad"),
    pais: document.getElementById("campo-pais"),
    fecha: document.getElementById("campo-fecha"),
    imagen: document.getElementById("campo-imagen"),
    imagenDescripcion: document.getElementById("campo-imagen-descripcion"),
    texto: document.getElementById("campo-texto")
  },
  imagenElegida: document.querySelector(".imagen-elegida"),
  imagenFoto: document.querySelector(".imagen-elegida img"),
  elegirImagen: document.querySelector("[data-elegir-imagen]"),
  quitarImagen: document.querySelector('[data-accion="quitar-imagen"]'),
  descripcionImagen: document.querySelector("[data-descripcion-imagen]"),
  errorImagen: document.getElementById("error-imagen"),
  enlaces: document.querySelector(".enlaces-editables"),
  plantillaEnlace: document.getElementById("plantilla-enlace"),
  errorFormulario: document.querySelector('[data-error="formulario"]'),
  bloqueBorrar: document.querySelector(".formulario__borrar"),
  confirmaciones: {
    reiniciar: document.querySelector('[data-confirmacion="reiniciar"]'),
    borrar: document.querySelector('[data-confirmacion="borrar"]')
  },
  aviso: document.querySelector(".aviso"),
  avisoTexto: document.querySelector(".aviso__texto"),
  avisoEnlace: document.querySelector(".aviso__enlace")
};

const estado = {
  disputatios: [],
  vista: "lista",
  editando: null,
  punto: null,
  imagen: null,
  modo: "editar",
  contadorEnlaces: 0,
  temporizadorAviso: 0,
  globoListo: false
};

const ACCIONES = {
  nueva: empezarNueva,
  continuar,
  cancelar: volverALista,
  mover: moverPunto,
  exportar,
  reiniciar: () => mostrarConfirmacion("reiniciar"),
  "si-reiniciar": reiniciarDemo,
  "no-reiniciar": ocultarConfirmaciones,
  borrador: () => guardar("borrador"),
  borrar: () => mostrarConfirmacion("borrar"),
  "si-borrar": confirmarBorrado,
  "no-borrar": ocultarConfirmaciones,
  "quitar-imagen": () => ponerImagen(null),
  "insertar-enlace": insertarEnlace,
  "anadir-enlace": () => anadirFilaEnlace().querySelector("input").focus()
};

function esEscritorio() {
  return window.innerWidth >= ANCHO_ESCRITORIO;
}

function calcularHueco() {
  if (!esEscritorio()) return { abajo: dom.panel.offsetHeight };
  const margen = parseFloat(getComputedStyle(dom.panel).right) || 0;
  return { derecha: dom.panel.offsetWidth + margen };
}

function actualizarHueco() {
  fijarHueco(calcularHueco());
}

function mostrarVista(nombre) {
  estado.vista = nombre;
  document.body.dataset.vista = nombre;
  dom.vistas.forEach((vista) => {
    vista.hidden = vista.dataset.vista !== nombre;
  });
  dom.panel.scrollTop = 0;
}

function etiquetaMarcador(disputatio) {
  return `${disputatio.titulo}, ${disputatio.ciudad}`;
}

function claseMarcador(disputatio) {
  return disputatio.estado === "borrador" ? "marcador--borrador" : "";
}

function crearChip(texto, clase) {
  const chip = document.createElement("span");
  chip.className = `chip ${clase}`;
  chip.textContent = texto;
  return chip;
}

function crearFilaPropia(disputatio) {
  const elemento = document.createElement("li");
  const boton = document.createElement("button");
  const titulo = document.createElement("span");
  const datos = document.createElement("span");
  boton.type = "button";
  boton.className = "propia";
  titulo.className = "propia__titulo";
  titulo.lang = disputatio.idioma || "";
  titulo.textContent = disputatio.titulo;
  datos.className = "propia__datos";
  datos.append(document.createTextNode(`${disputatio.ciudad}, ${formatearFecha(disputatio.fecha)}`));
  if (disputatio.estado === "borrador") datos.append(crearChip(t("borrador"), "chip--borrador"));
  if (disputatio.ejemplo) datos.append(crearChip(t("ejemplo"), "chip--ejemplo"));
  boton.append(titulo, datos);
  boton.addEventListener("click", () => editar(disputatio.id));
  elemento.append(boton);
  return elemento;
}

function pintarLista() {
  const ordenadas = [...estado.disputatios].reverse();
  dom.propias.replaceChildren(...ordenadas.map(crearFilaPropia));
  dom.vacio.hidden = ordenadas.length > 0;
}

function pintarMarcadores() {
  if (!estado.globoListo) return;
  ponerMarcadores(estado.disputatios, { alPulsar: alPulsarMarcador, etiqueta: etiquetaMarcador, clase: claseMarcador });
  if (estado.editando) marcarActivo(estado.editando.id);
}

function refrescar() {
  estado.disputatios = leerDisputatios({ incluirBorradores: true });
  pintarLista();
  pintarMarcadores();
}

function pintarCoordenadas() {
  const texto = estado.punto ? t("coordenadas", estado.punto.lat, estado.punto.lng) : t("sinPunto");
  dom.coordenadas.forEach((elemento) => {
    elemento.textContent = texto;
  });
}

function pintarTitulosEdicion() {
  dom.titulosEdicion.forEach((titulo) => {
    titulo.textContent = t(estado.editando ? "editarTitulo" : "nueva");
  });
}

function mostrarAviso(texto, id = null) {
  window.clearTimeout(estado.temporizadorAviso);
  dom.avisoTexto.textContent = texto;
  dom.avisoEnlace.hidden = !id;
  if (id) dom.avisoEnlace.href = `disputatio.html#${encodeURIComponent(id)}`;
  dom.aviso.hidden = false;
  estado.temporizadorAviso = window.setTimeout(() => {
    dom.aviso.hidden = true;
  }, DURACION_AVISO);
}

function mostrarConfirmacion(nombre) {
  const confirmacion = dom.confirmaciones[nombre];
  confirmacion.hidden = false;
  confirmacion.querySelector(".boton--secundario").focus();
}

function ocultarConfirmaciones() {
  Object.values(dom.confirmaciones).forEach((confirmacion) => {
    confirmacion.hidden = true;
  });
}

function ponerImagen(imagen) {
  estado.imagen = imagen ? { src: imagen.src } : null;
  dom.imagenElegida.hidden = !imagen;
  dom.quitarImagen.hidden = !imagen;
  dom.descripcionImagen.hidden = !imagen;
  dom.elegirImagen.dataset.t = imagen ? "cambiarImagen" : "elegirImagen";
  dom.elegirImagen.textContent = t(dom.elegirImagen.dataset.t);
  dom.campos.imagenDescripcion.value = imagen?.descripcion || "";
  if (imagen) dom.imagenFoto.src = imagen.src;
  else dom.imagenFoto.removeAttribute("src");
}

function cargarImagen(archivo) {
  return new Promise((resolver, rechazar) => {
    const direccion = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      URL.revokeObjectURL(direccion);
      resolver(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(direccion);
      rechazar(new Error("imagen"));
    };
    imagen.src = direccion;
  });
}

function reducirImagen(imagen) {
  const escala = Math.min(1, LADO_MAXIMO_IMAGEN / Math.max(imagen.naturalWidth, imagen.naturalHeight));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.naturalWidth * escala);
  lienzo.height = Math.round(imagen.naturalHeight * escala);
  lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL("image/jpeg", CALIDAD_IMAGEN);
}

async function alElegirImagen() {
  const [archivo] = dom.campos.imagen.files;
  dom.campos.imagen.value = "";
  if (!archivo) return;
  ocultarError(dom.errorImagen, dom.campos.imagen);
  try {
    if (!archivo.type.startsWith("image/")) throw new Error("tipo");
    ponerImagen({ src: reducirImagen(await cargarImagen(archivo)), descripcion: dom.campos.imagenDescripcion.value });
  } catch {
    mostrarError(dom.errorImagen, dom.campos.imagen, t("errorImagen"));
  }
}

function anadirFilaEnlace(enlace = { texto: "", url: "" }) {
  const fila = dom.plantillaEnlace.content.firstElementChild.cloneNode(true);
  const numero = (estado.contadorEnlaces += 1);
  const [etiquetaTexto, etiquetaUrl] = fila.querySelectorAll("label");
  const texto = fila.querySelector('[data-parte="texto"]');
  const url = fila.querySelector('[data-parte="url"]');
  const error = fila.querySelector(".campo__error");
  texto.id = `campo-enlace-texto-${numero}`;
  url.id = `campo-enlace-url-${numero}`;
  error.id = `error-enlace-${numero}`;
  etiquetaTexto.htmlFor = texto.id;
  etiquetaUrl.htmlFor = url.id;
  texto.setAttribute("aria-describedby", error.id);
  url.setAttribute("aria-describedby", error.id);
  texto.value = enlace.texto;
  url.value = enlace.url;
  fila.querySelector(".enlace-editable__quitar").addEventListener("click", () => fila.remove());
  aplicarTextos(fila);
  dom.enlaces.append(fila);
  return fila;
}

function leerEnlaces() {
  return [...dom.enlaces.querySelectorAll(".enlace-editable")].map((fila) => ({
    fila,
    texto: fila.querySelector('[data-parte="texto"]').value.trim(),
    url: fila.querySelector('[data-parte="url"]').value.trim()
  }));
}

function insertarEnlace() {
  const area = dom.campos.texto;
  const inicio = area.selectionStart;
  const fin = area.selectionEnd;
  const seleccion = area.value.slice(inicio, fin);
  const textoEnlace = seleccion || t("textoEnlace");
  const bloque = `[${textoEnlace}](https://)`;
  area.focus();
  area.setRangeText(bloque, inicio, fin, "end");
  if (seleccion) area.setSelectionRange(inicio + bloque.length - 1, inicio + bloque.length - 1);
  else area.setSelectionRange(inicio + 1, inicio + 1 + textoEnlace.length);
}

function mostrarError(error, campo, mensaje) {
  error.textContent = mensaje;
  error.hidden = false;
  if (campo) campo.setAttribute("aria-invalid", "true");
}

function ocultarError(error, campo) {
  error.textContent = "";
  error.hidden = true;
  if (campo) campo.removeAttribute("aria-invalid");
}

function limpiarErrores() {
  dom.panel.querySelectorAll(".campo__error").forEach((error) => {
    error.textContent = "";
    error.hidden = true;
  });
  dom.panel.querySelectorAll("[aria-invalid]").forEach((campo) => campo.removeAttribute("aria-invalid"));
  dom.errorFormulario.hidden = true;
}

function limpiarFormulario() {
  dom.formulario.reset();
  dom.formulario.elements.idioma.value = idioma();
  ponerImagen(null);
  dom.enlaces.replaceChildren();
  limpiarErrores();
  cambiarModo("editar");
  ocultarConfirmaciones();
  dom.bloqueBorrar.hidden = true;
}

function rellenarFormulario(disputatio) {
  limpiarFormulario();
  dom.formulario.elements.idioma.value = disputatio.idioma || idioma();
  dom.campos.titulo.value = disputatio.titulo || "";
  dom.campos.participantes.value = disputatio.participantes || "";
  dom.campos.ciudad.value = disputatio.ciudad || "";
  dom.campos.pais.value = disputatio.pais || "";
  dom.campos.fecha.value = disputatio.fecha || "";
  dom.campos.texto.value = disputatio.texto || "";
  ponerImagen(disputatio.imagen?.src ? disputatio.imagen : null);
  (disputatio.enlaces || []).forEach((enlace) => anadirFilaEnlace(enlace));
  dom.bloqueBorrar.hidden = false;
}

function leerFormulario() {
  const disputatio = {
    id: estado.editando?.id || "",
    idioma: dom.formulario.elements.idioma.value,
    estado: estado.editando?.estado || "borrador",
    titulo: dom.campos.titulo.value.trim(),
    participantes: dom.campos.participantes.value.trim(),
    ciudad: dom.campos.ciudad.value.trim(),
    pais: dom.campos.pais.value.trim(),
    fecha: dom.campos.fecha.value,
    lat: estado.punto ? Number(estado.punto.lat.toFixed(4)) : null,
    lng: estado.punto ? Number(estado.punto.lng.toFixed(4)) : null,
    texto: dom.campos.texto.value.replace(/\r\n/g, "\n").trim(),
    enlaces: leerEnlaces().filter((enlace) => enlace.texto || enlace.url).map(({ texto, url }) => ({ texto, url }))
  };
  if (estado.imagen) disputatio.imagen = { src: estado.imagen.src, descripcion: dom.campos.imagenDescripcion.value.trim() };
  return disputatio;
}

function enlacesIncompletos(texto) {
  return [...texto.matchAll(PATRON_ENLACE_EN_TEXTO)].some(([, url]) => !urlValida(url.trim()));
}

function validar() {
  const errores = [];
  CAMPOS_OBLIGATORIOS.forEach(([nombre, clave]) => {
    const campo = dom.campos[nombre];
    if (!campo.value.trim()) errores.push({ campo, error: document.getElementById(`error-${nombre}`), mensaje: t(clave) });
  });
  if (dom.campos.texto.value.trim() && enlacesIncompletos(dom.campos.texto.value)) {
    errores.push({ campo: dom.campos.texto, error: document.getElementById("error-texto"), mensaje: t("errorEnlaceEnTexto") });
  }
  leerEnlaces().forEach(({ fila, texto, url }) => {
    const error = fila.querySelector(".campo__error");
    if (url && !urlValida(url)) errores.push({ campo: fila.querySelector('[data-parte="url"]'), error, mensaje: t("errorEnlaceUrl") });
    else if (url && !texto) errores.push({ campo: fila.querySelector('[data-parte="texto"]'), error, mensaje: t("errorEnlaceTexto") });
    else if (texto && !url) errores.push({ campo: fila.querySelector('[data-parte="url"]'), error, mensaje: t("errorEnlaceUrl") });
  });
  return errores;
}

function mostrarErrores(errores) {
  errores.forEach(({ campo, error, mensaje }) => mostrarError(error, campo, mensaje));
  dom.errorFormulario.textContent = t("errorFormulario");
  dom.errorFormulario.hidden = false;
  errores[0].campo.focus();
}

function cambiarModo(modo) {
  estado.modo = modo;
  dom.modos.forEach((boton) => boton.setAttribute("aria-pressed", String(boton.dataset.modo === modo)));
  dom.formulario.hidden = modo !== "editar";
  dom.previa.hidden = modo !== "previa";
  if (modo === "previa") {
    const disputatio = leerFormulario();
    pintarArticulo(dom.previa, { ...disputatio, titulo: disputatio.titulo || t("nueva") });
  }
}

function empezarNueva() {
  estado.editando = null;
  estado.punto = null;
  limpiarFormulario();
  ponerPuntoNuevo(null);
  marcarActivo(null);
  pintarTitulosEdicion();
  pintarCoordenadas();
  dom.continuar.disabled = true;
  mostrarVista("colocar");
  reposar();
}

function editar(id) {
  const disputatio = buscarDisputatio(id);
  if (!disputatio) return;
  estado.editando = disputatio;
  estado.punto = { lat: disputatio.lat, lng: disputatio.lng };
  rellenarFormulario(disputatio);
  ponerPuntoNuevo(estado.punto);
  marcarActivo(id);
  pintarTitulosEdicion();
  pintarCoordenadas();
  mostrarVista("formulario");
  enfocar(estado.punto);
  dom.panel.querySelector('[data-vista="formulario"] .vista__titulo').focus({ preventScroll: true });
}

function alPulsarMarcador(id) {
  if (estado.vista === "lista") editar(id);
}

function alTocarGlobo(x, y) {
  if (estado.vista !== "colocar") return;
  const lugar = lugarEn(x, y);
  if (!lugar) return;
  estado.punto = lugar;
  ponerPuntoNuevo(lugar);
  pintarCoordenadas();
  dom.continuar.disabled = false;
}

function continuar() {
  if (!estado.punto) return;
  mostrarVista("formulario");
  dom.bloqueBorrar.hidden = !estado.editando;
  enfocar(estado.punto);
  if (esEscritorio()) dom.campos.titulo.focus({ preventScroll: true });
}

function moverPunto() {
  mostrarVista("colocar");
  dom.continuar.disabled = !estado.punto;
  if (estado.punto) mirarA(estado.punto);
}

function volverALista() {
  estado.editando = null;
  estado.punto = null;
  ponerPuntoNuevo(null);
  marcarActivo(null);
  ocultarConfirmaciones();
  mostrarVista("lista");
  reposar();
}

function guardar(estadoPublicacion) {
  limpiarErrores();
  const errores = validar();
  if (errores.length) {
    cambiarModo("editar");
    return mostrarErrores(errores);
  }
  const disputatio = { ...leerFormulario(), estado: estadoPublicacion };
  disputatio.id = disputatio.id || crearId(disputatio);
  try {
    guardarDisputatio(disputatio);
  } catch {
    dom.errorFormulario.textContent = t("errorEspacio");
    dom.errorFormulario.hidden = false;
    return;
  }
  refrescar();
  volverALista();
  mostrarAviso(t(estadoPublicacion === "publicado" ? "avisoPublicada" : "avisoBorrador"), estadoPublicacion === "publicado" ? disputatio.id : null);
}

function confirmarBorrado() {
  if (!estado.editando) return;
  borrarDisputatio(estado.editando.id);
  refrescar();
  volverALista();
  mostrarAviso(t("avisoBorrada"));
}

function reiniciarDemo() {
  vaciarLocal();
  ocultarConfirmaciones();
  refrescar();
  mostrarAviso(t("avisoReinicio"));
}

function exportar() {
  const archivo = new Blob([exportarJSON()], { type: "application/json" });
  const direccion = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = direccion;
  enlace.download = "disputatio.json";
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(direccion), 1000);
}

function alPulsarAccion(evento) {
  const boton = evento.target.closest("[data-accion]");
  if (!boton || boton.disabled) return;
  ACCIONES[boton.dataset.accion]?.();
}

function alEnviar(evento) {
  evento.preventDefault();
  guardar("publicado");
}

function alTeclado(evento) {
  if (evento.key === "Escape") ocultarConfirmaciones();
}

function alCambiarIdioma() {
  document.title = t("tituloCreacion");
  refrescar();
  pintarCoordenadas();
  pintarTitulosEdicion();
  if (estado.modo === "previa") cambiarModo("previa");
}

function conectar() {
  dom.panel.addEventListener("click", alPulsarAccion);
  dom.formulario.addEventListener("submit", alEnviar);
  dom.campos.imagen.addEventListener("change", alElegirImagen);
  dom.modos.forEach((boton) => boton.addEventListener("click", () => cambiarModo(boton.dataset.modo)));
  window.addEventListener("keydown", alTeclado);
  window.addEventListener("resize", actualizarHueco);
  document.addEventListener("cambio-idioma", alCambiarIdioma);
  new ResizeObserver(actualizarHueco).observe(dom.panel);
}

async function iniciar() {
  aplicarTextos();
  document.title = t("tituloCreacion");
  conectarSelectorIdioma();
  conectar();
  refrescar();
  try {
    await iniciarGlobo({ lienzo: dom.lienzo, capa: dom.capa, alTocar: alTocarGlobo });
    estado.globoListo = true;
    pintarMarcadores();
  } catch {
    dom.lienzo.hidden = true;
    dom.sin3d.hidden = false;
    dom.nueva.disabled = true;
  }
  document.body.classList.remove("cargando");
  actualizarHueco();
}

iniciar();
