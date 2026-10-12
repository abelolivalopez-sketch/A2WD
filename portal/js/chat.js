// =====================================================================
//  Chat del portal: lo usan el panel de cliente y el de creadores.
//  Aquí solo se pinta el hilo y se prepara la caja de escribir;
//  cada panel decide qué mensajes carga y cómo los envía.
// =====================================================================
import { esc } from './app.js';

const PAUSA_GRUPO = 5 * 60 * 1000;     // mensajes seguidos del mismo autor en menos de 5 min van juntos
const ALTO_MAX_CAJA = 160;             // px: la caja de escribir crece hasta aquí y luego hace scroll
const ES_TACTIL = 'ontouchstart' in window;
const URL_EN_TEXTO = /\bhttps?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]]/g;

export const TEXTOS_ES = { hoy: 'Hoy', ayer: 'Ayer', nuevos: 'Nuevos', vacio: 'Todavía no hay mensajes.' };

// ---------- Fechas ----------
const mismoDia = (a, b) => a.toDateString() === b.toDateString();
const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

export const hora = (iso, locale) =>
  new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

// Separador del hilo: «Hoy», «Ayer», «lunes, 6 de octubre» (con año si no es el actual)
function etiquetaDia(d, locale, textos) {
  if (mismoDia(d, new Date())) return textos.hoy;
  if (mismoDia(d, diasAtras(1))) return textos.ayer;
  const formato = { weekday: 'long', day: 'numeric', month: 'long' };
  if (d.getFullYear() !== new Date().getFullYear()) formato.year = 'numeric';
  return d.toLocaleDateString(locale, formato);
}

// Lista de conversaciones: hora si es de hoy, «Ayer», día de la semana o fecha corta
export function cuando(iso, { locale = 'es-ES', textos = TEXTOS_ES } = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  if (mismoDia(d, new Date())) return hora(iso, locale);
  if (mismoDia(d, diasAtras(1))) return textos.ayer;
  if (d > diasAtras(6)) return d.toLocaleDateString(locale, { weekday: 'short' });
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

// ---------- Texto ----------
// Escapa el mensaje y convierte las direcciones http(s) en enlaces
export function textoConEnlaces(texto = '') {
  let html = '';
  let desde = 0;
  for (const m of texto.matchAll(URL_EN_TEXTO)) {
    html += esc(texto.slice(desde, m.index));
    html += `<a href="${esc(m[0])}" target="_blank" rel="noopener noreferrer">${esc(m[0])}</a>`;
    desde = m.index + m[0].length;
  }
  return html + esc(texto.slice(desde));
}

// Avatar con iniciales; el tono sale del id para que cada cliente tenga siempre el mismo
export function avatar(nombre, id = '') {
  const iniciales = String(nombre || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || '·';
  const tono = Math.round([...String(id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) * 137.5) % 360;   // ángulo dorado: tonos bien repartidos
  return `<span class="chat-avatar" style="--tono:${tono}" aria-hidden="true">${esc(iniciales)}</span>`;
}

// ---------- Hilo ----------
/**
 * Agrupa los mensajes en bloques del mismo autor. Un bloque nuevo empieza si:
 * cambia el autor, cambia el día, pasan más de 5 min, cambia el tema (proyecto)
 * o es el primer mensaje sin leer.
 */
function agrupar(mensajes, { esMio, tema, primerNuevo }) {
  const grupos = [];
  for (const m of mensajes) {
    const fecha = new Date(m.created_at);
    const ultimo = grupos.at(-1);
    const sigue = ultimo
      && ultimo.autorId === m.autor_id
      && ultimo.tema === tema(m)
      && m.id !== primerNuevo
      && mismoDia(ultimo.hasta, fecha)
      && fecha - ultimo.hasta < PAUSA_GRUPO;
    if (sigue) {
      ultimo.mensajes.push(m);
      ultimo.hasta = fecha;
    } else {
      grupos.push({ autorId: m.autor_id, mio: esMio(m), tema: tema(m), nuevo: m.id === primerNuevo, desde: fecha, hasta: fecha, mensajes: [m] });
    }
  }
  return grupos;
}

/**
 * Devuelve el HTML del hilo.
 * @param {Array}  mensajes    filas de `comentarios`, en orden de llegada
 * @param {Object} op
 *   esMio(m)      → true si el mensaje va a la derecha
 *   autor(m)      → nombre a mostrar encima del bloque ('' para no mostrarlo)
 *   tema(m)       → texto del proyecto ('' si no hay); se enseña cuando cambia
 *   extra(m)      → HTML opcional bajo la burbuja (p. ej. etiquetas de la IA)
 *   primerNuevo   → id del primer mensaje sin leer (pone la marca «Nuevos»)
 *   locale, textos
 */
export function pintarHilo(mensajes, {
  esMio, autor, tema = () => '', extra = () => '', primerNuevo = null,
  locale = 'es-ES', textos = TEXTOS_ES,
}) {
  if (!mensajes.length) return `<p class="chat-vacio">${esc(textos.vacio)}</p>`;

  let html = '';
  let diaAnterior = null;
  let temaAnterior = '';
  for (const g of agrupar(mensajes, { esMio, tema, primerNuevo })) {
    if (!diaAnterior || !mismoDia(diaAnterior, g.desde)) {
      html += `<p class="chat-sep"><span>${esc(etiquetaDia(g.desde, locale, textos))}</span></p>`;
      diaAnterior = g.desde;
    }
    if (g.nuevo) html += `<p class="chat-sep chat-sep-nuevos"><span>${esc(textos.nuevos)}</span></p>`;

    const nombre = autor(g.mensajes[0]);
    const temaNuevo = g.tema && g.tema !== temaAnterior ? `<span class="chat-tema">${esc(g.tema)}</span>` : '';
    if (g.tema) temaAnterior = g.tema;

    html += `<div class="chat-grupo${g.mio ? ' mio' : ''}">
      ${nombre || temaNuevo ? `<p class="chat-autor">${esc(nombre)}${temaNuevo}</p>` : ''}
      ${g.mensajes.map((m) => burbuja(m, locale, extra)).join('')}
    </div>`;
  }
  return html;
}

const burbuja = (m, locale, extra) => `
  <div class="chat-msg" data-id="${esc(m.id)}">
    <p class="chat-texto">${textoConEnlaces(m.mensaje)}<time class="chat-hora" datetime="${esc(m.created_at)}">${hora(m.created_at, locale)}</time></p>
    ${extra(m)}
  </div>`;

// ---------- Scroll ----------
export const cercaDelFondo = (hilo) => hilo.scrollHeight - hilo.scrollTop - hilo.clientHeight < 80;
export const alFondo = (hilo) => { hilo.scrollTop = hilo.scrollHeight; };

// Repinta el hilo sin mover al usuario si estaba leyendo más arriba
export function repintar(hilo, html, { forzarFondo = false } = {}) {
  const seguir = forzarFondo || cercaDelFondo(hilo);
  hilo.innerHTML = html;
  if (seguir) alFondo(hilo);
}

// ---------- Caja de escribir ----------
/**
 * Conecta un <form class="chat-escribir"> con textarea y botón de enviar.
 * - Crece al escribir (hasta 160 px).
 * - Intro envía en ordenador; Mayús+Intro hace salto de línea. En el móvil, Intro es salto de línea.
 * - El botón solo se activa con texto y si `puedeEnviar()` lo permite (p. ej. sin conexión).
 * - `alEnviar(texto)` devuelve true si se envió; entonces se vacía la caja.
 */
export function prepararEscritura(form, { alEnviar, puedeEnviar = () => true }) {
  const txt = form.querySelector('textarea');
  const boton = form.querySelector('button[type="submit"]');
  let enviando = false;

  const ajustar = () => {
    txt.style.height = 'auto';
    txt.style.height = Math.min(txt.scrollHeight, ALTO_MAX_CAJA) + 'px';
    boton.disabled = enviando || !txt.value.trim() || !puedeEnviar();
  };

  txt.addEventListener('input', ajustar);
  txt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !ES_TACTIL) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = txt.value.trim();
    if (!texto || enviando || !puedeEnviar()) return;
    enviando = true; ajustar();
    const ok = await alEnviar(texto);
    enviando = false;
    if (ok) txt.value = '';
    ajustar();
    txt.focus();
  });

  ajustar();
  return {
    txt,
    ajustar,
    poner(texto) { txt.value = texto; ajustar(); txt.focus(); },
  };
}

// Pista de teclado (solo tiene sentido con teclado físico)
export const pistaTeclado = (texto = 'Intro para enviar · Mayús + Intro, nueva línea') =>
  ES_TACTIL ? '' : `<p class="chat-pista">${esc(texto)}</p>`;
