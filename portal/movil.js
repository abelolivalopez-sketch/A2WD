// =====================================================================
//  Funciones "de app" del portal A2WD
//  1) Modo sin conexión: guarda en el móvil la última copia de lo que
//     ve el cliente (proyecto, avances, mensajes) y la enseña si no hay
//     internet, con un aviso de cuándo se actualizó.
//  2) Notificaciones: botón para activar avisos en el móvil (Web Push).
// =====================================================================
import { LANG } from './i18n.js';
import { VAPID_PUBLIC_KEY } from './config.js';

const T = {
  es: {
    sin_red: 'Sin conexión', sin_red_sub: 'Estás viendo la copia guardada del {f}. Se actualizará sola al volver internet.',
    sin_red_nunca: 'Sin conexión y todavía no hay una copia guardada en este móvil. Ábrela una vez con internet.',
    sin_red_enviar: 'Sin conexión: podrás enviar mensajes al volver internet.',
    avisos_on: 'Avisos activados', avisos_off: 'Activar avisos', avisos_bloq: 'Avisos bloqueados',
    avisos_bloq_ayuda: 'Has bloqueado las notificaciones. Actívalas en los ajustes del móvil para esta app.',
    avisos_ios: 'En iPhone, primero instala la app en tu pantalla de inicio y ábrela desde allí para activar los avisos.',
    avisos_ok: 'Listo: te avisaremos de mensajes y avances.', avisos_quitados: 'Avisos desactivados en este dispositivo.',
    avisos_err: 'No se han podido activar los avisos. Inténtalo de nuevo.',
    avisos_title: 'Recibe un aviso cuando haya mensajes o avances',
  },
  fr: {
    sin_red: 'Hors connexion', sin_red_sub: 'Vous consultez la copie enregistrée du {f}. Elle se mettra à jour dès le retour d’internet.',
    sin_red_nunca: 'Hors connexion et aucune copie n’est encore enregistrée sur ce téléphone. Ouvrez-la une fois avec internet.',
    sin_red_enviar: 'Hors connexion : vous pourrez envoyer des messages au retour d’internet.',
    avisos_on: 'Notifications activées', avisos_off: 'Activer les notifications', avisos_bloq: 'Notifications bloquées',
    avisos_bloq_ayuda: 'Vous avez bloqué les notifications. Activez-les dans les réglages du téléphone pour cette app.',
    avisos_ios: 'Sur iPhone, installez d’abord l’app sur l’écran d’accueil et ouvrez-la depuis là pour activer les notifications.',
    avisos_ok: 'C’est fait : nous vous préviendrons des messages et des avancées.', avisos_quitados: 'Notifications désactivées sur cet appareil.',
    avisos_err: 'Impossible d’activer les notifications. Réessayez.',
    avisos_title: 'Soyez prévenu des nouveaux messages et avancées',
  },
  it: {
    sin_red: 'Offline', sin_red_sub: 'Stai vedendo la copia salvata del {f}. Si aggiornerà da sola quando torna internet.',
    sin_red_nunca: 'Sei offline e su questo telefono non c’è ancora una copia salvata. Aprila una volta con internet.',
    sin_red_enviar: 'Offline: potrai inviare messaggi quando torna internet.',
    avisos_on: 'Notifiche attive', avisos_off: 'Attiva le notifiche', avisos_bloq: 'Notifiche bloccate',
    avisos_bloq_ayuda: 'Hai bloccato le notifiche. Attivale nelle impostazioni del telefono per questa app.',
    avisos_ios: 'Su iPhone, installa prima l’app nella schermata Home e aprila da lì per attivare le notifiche.',
    avisos_ok: 'Fatto: ti avviseremo di messaggi e avanzamenti.', avisos_quitados: 'Notifiche disattivate su questo dispositivo.',
    avisos_err: 'Non è stato possibile attivare le notifiche. Riprova.',
    avisos_title: 'Ricevi un avviso per nuovi messaggi e avanzamenti',
  },
  en: {
    sin_red: 'Offline', sin_red_sub: 'You’re viewing the copy saved on {f}. It will refresh by itself when you’re back online.',
    sin_red_nunca: 'You’re offline and there’s no saved copy on this phone yet. Open it once with internet.',
    sin_red_enviar: 'Offline: you can send messages once you’re back online.',
    avisos_on: 'Notifications on', avisos_off: 'Turn on notifications', avisos_bloq: 'Notifications blocked',
    avisos_bloq_ayuda: 'You’ve blocked notifications. Turn them on in your phone settings for this app.',
    avisos_ios: 'On iPhone, first add the app to your home screen and open it from there to turn on notifications.',
    avisos_ok: 'Done: we’ll let you know about messages and updates.', avisos_quitados: 'Notifications turned off on this device.',
    avisos_err: 'Couldn’t turn on notifications. Please try again.',
    avisos_title: 'Get notified about new messages and updates',
  },
};
const LOCALES = { es: 'es-ES', fr: 'fr-FR', it: 'it-IT', en: 'en-GB' };
let idioma = LANG;
const tx = (k, v = {}) => String((T[idioma] || T.es)[k] ?? T.es[k]).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');

/** El panel de creadores fuerza español */
export function idiomaMovil(l) { if (T[l]) idioma = l; }

// ---------------------------------------------------------------------
//  1) SIN CONEXIÓN
// ---------------------------------------------------------------------
const PREFIJO = 'a2wd_copia_';

/** ¿El error de Supabase se debe a falta de internet? */
export const esFalloRed = (error) =>
  !!error && (!navigator.onLine || /fetch|network|load failed|conexi/i.test(String(error.message || error)));

export function guardarCopia(uid, clave, datos) {
  try { localStorage.setItem(PREFIJO + uid + '_' + clave, JSON.stringify({ f: new Date().toISOString(), d: datos })); } catch {}
}
export function leerCopia(uid, clave) {
  try { const v = JSON.parse(localStorage.getItem(PREFIJO + uid + '_' + clave)); return v ? { datos: v.d, fecha: v.f } : null; } catch { return null; }
}
/** Sesión guardada por Supabase en el móvil (para abrir la app sin internet
 *  aunque el token haya caducado; al volver la red se renueva sola). */
export function sesionGuardada(supabaseUrl) {
  try {
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    const s = JSON.parse(localStorage.getItem(`sb-${ref}-auth-token`));
    return s?.user?.id ? { user: s.user, sinConexion: true } : null;
  } catch { return null; }
}
export function borrarCopias() {
  try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIJO)).forEach((k) => localStorage.removeItem(k)); } catch {}
}

/** Muestra/oculta la franja "Sin conexión" bajo la cabecera */
export function franjaSinConexion(fechaCopia) {
  let el = document.getElementById('franjaRed');
  if (fechaCopia === false) { el?.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'franjaRed';
    el.setAttribute('role', 'status');
    el.style.cssText = 'background:var(--soft);border-bottom:1px solid var(--line);padding:10px 24px;font-size:13.5px;color:var(--ink-soft);display:flex;gap:10px;align-items:baseline;flex-wrap:wrap';
    const top = document.querySelector('header.top');
    top ? top.after(el) : document.body.prepend(el);
  }
  const f = fechaCopia
    ? tx('sin_red_sub', { f: new Date(fechaCopia).toLocaleString(LOCALES[idioma], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) })
    : tx('sin_red_nunca');
  el.innerHTML = `<b class="mono" style="font-size:12.5px;color:var(--warn)">● ${tx('sin_red')}</b><span></span>`;
  el.querySelector('span').textContent = f;
}
export const textoSinRedEnviar = () => tx('sin_red_enviar');

// ---------------------------------------------------------------------
//  2) NOTIFICACIONES (Web Push)
// ---------------------------------------------------------------------
const soportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function claveBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registro() {
  const base = new URL('../', import.meta.url);
  return (await navigator.serviceWorker.getRegistration(base.pathname)) ||
    navigator.serviceWorker.register(new URL('sw.js', base).href, { scope: base.pathname });
}

async function suscripcionActual() {
  if (!soportado()) return null;
  const reg = await navigator.serviceWorker.getRegistration(new URL('../', import.meta.url).pathname);
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Botón "Activar avisos". sb = cliente de Supabase ya conectado. */
export async function botonAvisos(destino, sb) {
  if (!destino) return;
  // iPhone en Safari (sin instalar): Apple solo permite avisos en la app instalada
  if (esIOS() && !instalada()) {
    if (!soportado() && !('serviceWorker' in navigator)) return;
    pintar('🔔 ' + tx('avisos_off'), () => {
      if (window.A2WDApp) window.A2WDApp.instalar(); else alert(tx('avisos_ios'));
    }, tx('avisos_ios'));
    return;
  }
  if (!soportado()) return;

  const refrescar = async () => {
    if (Notification.permission === 'denied') {
      pintar('🔕 ' + tx('avisos_bloq'), () => alert(tx('avisos_bloq_ayuda')), tx('avisos_bloq_ayuda'), true);
      return;
    }
    const sub = await suscripcionActual();
    if (sub && Notification.permission === 'granted') {
      // Mantiene el dispositivo asociado al usuario conectado
      guardarEnServidor(sb, sub).catch(() => {});
      pintar('🔔 ' + tx('avisos_on') + ' ✓', async () => {
        try { await sb.rpc('quitar_push', { p_endpoint: sub.endpoint }); } catch {}
        try { await sub.unsubscribe(); } catch {}
        aviso(tx('avisos_quitados')); refrescar();
      }, tx('avisos_title'), true);
    } else {
      pintar('🔔 ' + tx('avisos_off'), activar, tx('avisos_title'));
    }
  };

  async function activar() {
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') return refrescar();
      const reg = await registro();
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ||
        await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveBytes(VAPID_PUBLIC_KEY) });
      await guardarEnServidor(sb, sub);
      aviso(tx('avisos_ok'));
    } catch (e) {
      console.error(e); aviso(tx('avisos_err'), true);
    }
    refrescar();
  }

  function pintar(texto, accion, titulo, activo = false) {
    destino.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn small ' + (activo ? 'ghost' : 'solid');
    b.textContent = texto;
    b.title = titulo || '';
    b.onclick = accion;
    destino.appendChild(b);
  }
  refrescar();
}

async function guardarEnServidor(sb, sub) {
  const j = sub.toJSON();
  const { error } = await sb.rpc('registrar_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_idioma: idioma });
  if (error) throw error;
}

/** Al cerrar sesión: este móvil deja de recibir avisos de esa cuenta */
export async function quitarAvisosDispositivo(sb) {
  try {
    const sub = await suscripcionActual();
    if (sub) { await sb.rpc('quitar_push', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
  } catch {}
}

function aviso(msg, malo = false) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.className = 'toast show ' + (malo ? 'bad' : 'ok');
  clearTimeout(el._t); el._t = setTimeout(() => (el.className = 'toast'), 3600);
}
