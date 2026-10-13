import { EJEMPLOS } from "./ejemplos.js";

const CLAVE_DATOS = "disputatio-datos";
const VACIO = { disputatios: [], borrados: [] };

function leerLocal() {
  try {
    const datos = JSON.parse(window.localStorage.getItem(CLAVE_DATOS));
    if (!datos || !Array.isArray(datos.disputatios) || !Array.isArray(datos.borrados)) return structuredClone(VACIO);
    return datos;
  } catch {
    return structuredClone(VACIO);
  }
}

function escribirLocal(datos) {
  window.localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
}

function ordenarPorFecha(lista) {
  return [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo));
}

function aSlug(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function leerDisputatios({ incluirBorradores = false } = {}) {
  const local = leerLocal();
  const propias = new Map(local.disputatios.map((disputatio) => [disputatio.id, disputatio]));
  const ejemplos = EJEMPLOS
    .filter((disputatio) => !propias.has(disputatio.id) && !local.borrados.includes(disputatio.id))
    .map((disputatio) => ({ ...disputatio, ejemplo: true }));
  const todas = [...ejemplos, ...propias.values()];
  return ordenarPorFecha(incluirBorradores ? todas : todas.filter((disputatio) => disputatio.estado === "publicado"));
}

export function buscarDisputatio(id) {
  return leerDisputatios({ incluirBorradores: true }).find((disputatio) => disputatio.id === id) || null;
}

export function crearId(disputatio) {
  const base = aSlug(`${disputatio.ciudad} ${String(disputatio.fecha).slice(0, 4)}`) || "disputatio";
  const usados = new Set(leerDisputatios({ incluirBorradores: true }).map((existente) => existente.id));
  let id = base;
  for (let numero = 2; usados.has(id); numero += 1) id = `${base}-${numero}`;
  return id;
}

export function guardarDisputatio(disputatio) {
  const local = leerLocal();
  const { ejemplo, ...limpia } = disputatio;
  local.disputatios = [...local.disputatios.filter((existente) => existente.id !== limpia.id), limpia];
  escribirLocal(local);
  return limpia;
}

export function borrarDisputatio(id) {
  const local = leerLocal();
  local.disputatios = local.disputatios.filter((disputatio) => disputatio.id !== id);
  if (EJEMPLOS.some((disputatio) => disputatio.id === id) && !local.borrados.includes(id)) local.borrados.push(id);
  escribirLocal(local);
}

export function vaciarLocal() {
  try {
    window.localStorage.removeItem(CLAVE_DATOS);
  } catch {
    return;
  }
}

export function exportarJSON() {
  return JSON.stringify(leerDisputatios({ incluirBorradores: true }).map(({ ejemplo, ...disputatio }) => disputatio), null, 2);
}
