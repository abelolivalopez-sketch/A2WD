import { SUPABASE_URL, SUPABASE_KEY } from '../../portal/js/config.js';

const DOMINIOS = ['a2wdstudio.com', 'www.a2wdstudio.com'];
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|prerender|preview/i;
const CLAVE_EQUIPO = 'a2wd_equipo';

function leerLocal(clave) {
  try { return localStorage.getItem(clave); } catch { return null; }
}

function marcarEquipo(param) {
  try {
    if (param === 'no') localStorage.setItem(CLAVE_EQUIPO, '1');
    if (param === 'si') localStorage.removeItem(CLAVE_EQUIPO);
  } catch {}
}

function medible() {
  if (!DOMINIOS.includes(location.hostname)) return false;
  if (navigator.webdriver || BOTS.test(navigator.userAgent)) return false;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return false;
  return leerLocal(CLAVE_EQUIPO) !== '1';
}

function pagina() {
  return location.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '') || '/';
}

function referente() {
  try { return new URL(document.referrer).hostname; } catch { return ''; }
}

function dispositivo() {
  const ua = navigator.userAgent;
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (ipad || /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tableta';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'movil';
  return 'ordenador';
}

function zona() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}

function datosBase() {
  const q = new URLSearchParams(location.search);
  const ref = referente();
  return {
    p_pagina: pagina(),
    p_entrada: !DOMINIOS.includes(ref),
    p_referente: ref,
    p_campana: q.get('utm_source') || q.get('ref') || '',
    p_dispositivo: dispositivo(),
    p_idioma: (navigator.language || '').slice(0, 2),
    p_zona: zona(),
  };
}

function enviar(datos) {
  fetch(`${SUPABASE_URL}/rest/v1/rpc/registrar_visita`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(datos),
  }).catch(() => {});
}

function tipoContacto(enlace) {
  const href = enlace.getAttribute('href') || '';
  if (href.startsWith('mailto:')) return 'correo';
  if (href.startsWith('tel:')) return 'telefono';
  if (/wa\.me|whatsapp\.com/i.test(href)) return 'whatsapp';
  return '';
}

function contacto(detalle) {
  enviar({ ...datosBase(), p_tipo: 'contacto', p_detalle: detalle, p_entrada: false });
}

function vigilarContactos() {
  document.addEventListener('click', (e) => {
    const enlace = e.target.closest?.('a[href]');
    const detalle = enlace && tipoContacto(enlace);
    if (detalle) contacto(detalle);
  }, true);
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'contactForm') contacto('formulario');
  }, true);
}

function contarVista() {
  enviar({ ...datosBase(), p_tipo: 'vista' });
}

function cuandoVisible(fn) {
  if (document.visibilityState === 'visible') return fn();
  const una = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', una);
    fn();
  };
  document.addEventListener('visibilitychange', una);
}

marcarEquipo(new URLSearchParams(location.search).get('medir'));

if (medible()) {
  cuandoVisible(contarVista);
  vigilarContactos();
}
