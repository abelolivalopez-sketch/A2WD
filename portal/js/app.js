// Utilidades compartidas del portal A2WD
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { t, LOCALE } from './i18n.js';
import { esFalloRed, guardarCopia, leerCopia, borrarCopias, quitarAvisosDispositivo, sesionGuardada } from './movil.js';
export { t, LANG, selectorIdioma } from './i18n.js';

export const configurado = !SUPABASE_URL.includes('TU-PROYECTO') && !SUPABASE_KEY.startsWith('TU-');
export const sb = configurado ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const ESTADOS = {
  diseno: 'Diseño',
  desarrollo: 'Desarrollo',
  revision: 'Revisión',
  entregado: 'Entregado',
};
export const ORDEN_ESTADOS = ['diseno', 'desarrollo', 'revision', 'entregado'];

// Escapa texto antes de meterlo en HTML (evita inyección de código)
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Solo acepta enlaces http/https
export const urlSegura = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch { return null; }
};

export const fecha = (d, conHora = false) => {
  if (!d) return '—';
  const f = new Date(d);
  return f.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}) });
};

export const euros = (n) => Number(n || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export function toast(msg, tipo = 'ok') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = 'toast show ' + tipo;
  clearTimeout(el._t);
  el._t = setTimeout(() => (el.className = 'toast ' + tipo), 3200);
}

export function avisoSinConfigurar() {
  document.body.innerHTML = `
    <main class="centro"><div class="caja">
      <p class="eyebrow mono">Portal A2WD</p>
      <h1>Falta conectar Supabase</h1>
      <p class="muted">Abre <code>portal/config.js</code> y pega la URL de tu proyecto y la clave pública.</p>
    </div></main>`;
}

// Comprueba sesión y rol. Redirige si no corresponde.
export async function exigirSesion(rolRequerido) {
  if (!configurado) { avisoSinConfigurar(); return null; }
  let { data: { session } } = await sb.auth.getSession();
  if (!session && !navigator.onLine) session = sesionGuardada(SUPABASE_URL);
  if (!session) { location.replace('login.html'); return null; }
  let { data: perfil, error } = await sb.from('perfiles').select('*').eq('id', session.user.id).single();
  // Sin internet: se usa el perfil guardado la última vez (modo app sin conexión)
  if (error && esFalloRed(error)) { perfil = leerCopia(session.user.id, 'perfil')?.datos; error = null; }
  else if (perfil) guardarCopia(session.user.id, 'perfil', perfil);
  if (!perfil && !navigator.onLine) { location.replace('login.html'); return null; }
  if (error || !perfil) { await sb.auth.signOut(); location.replace('login.html?e=perfil'); return null; }
  if (rolRequerido && perfil.rol !== rolRequerido) {
    location.replace(perfil.rol === 'creador' ? 'creador.html' : 'cliente.html');
    return null;
  }
  return { session, perfil };
}

export async function salir() {
  await quitarAvisosDispositivo(sb);
  borrarCopias();
  try { await sb.auth.signOut(); } catch { try { await sb.auth.signOut({ scope: 'local' }); } catch {} }
  location.replace('../index.html');
}

export const LOGO = `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50,50 C50,35 38,22 24,22 C11,22 2,33 2,47 C2,61 11,72 24,72 C38,72 50,59 50,50 C50,35 62,22 76,22 C89,22 98,33 98,47 C98,61 89,72 76,72 C62,72 50,59 50,50 Z" stroke="currentColor" stroke-width="7"/></svg>`;

// Botón "Contraseña": cambiarla estando conectado, sin correos
export function activarCambioPassword() {
  const btn = document.getElementById('cambiarPw');
  if (!btn) return;
  const dlg = document.createElement('dialog');
  dlg.innerHTML = `
    <form method="dialog" id="fPw">
      <div class="dlg-head"><h3>${t('cambiar_pw')}</h3><button type="button" class="x" data-cerrar aria-label="${t('cerrar')}">×</button></div>
      <div class="dlg-body">
        <div class="campo"><label for="pwN1">${t('nueva_pw')}</label><input id="pwN1" type="password" autocomplete="new-password" minlength="8" required></div>
        <div class="campo"><label for="pwN2">${t('repite_pw')}</label><input id="pwN2" type="password" autocomplete="new-password" minlength="8" required></div>
        <p class="muted" style="font-size:13px">${t('min8')}</p>
        <p class="error" id="pwErr"></p>
      </div>
      <div class="dlg-foot"><button type="button" class="btn ghost" data-cerrar>${t('cancelar')}</button><button type="submit" class="btn solid">${t('guardar')}</button></div>
    </form>`;
  document.body.appendChild(dlg);
  dlg.querySelectorAll('[data-cerrar]').forEach((b) => (b.onclick = () => dlg.close()));
  btn.onclick = () => { dlg.querySelector('form').reset(); dlg.querySelector('#pwErr').textContent = ''; dlg.showModal(); };
  dlg.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = dlg.querySelector('#pwN1').value, p2 = dlg.querySelector('#pwN2').value;
    const err = dlg.querySelector('#pwErr');
    if (p1 !== p2) { err.textContent = t('no_coinciden'); return; }
    const b = e.target.querySelector('[type=submit]'); b.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1 });
    b.disabled = false;
    if (error) { err.textContent = t('err_guardar_pw', { e: error.message }); return; }
    dlg.close();
    toast(t('pw_ok'));
  });
}

// =====================================================================
//  Asistente IA (chat). Flotante en el panel del cliente o incrustado
//  en el panel del creador para probarlo.
// =====================================================================
export function chatAsistente({ destino = null, proyecto = () => null, modo = () => null, prueba = false } = {}) {
  const historial = [];
  const flotante = !destino;
  const caja = document.createElement('div');
  caja.className = 'asis-panel' + (flotante ? ' flotante oculto' : '');
  caja.innerHTML = `
    <div class="asis-cab">
      <div><strong>✦ Rodolfo</strong><p class="muted">${t('rod_sub')}</p></div>
      ${flotante ? `<button class="x" data-cerrar aria-label="${t('cerrar')}">×</button>` : ''}
    </div>
    <div class="asis-msgs" aria-live="polite"></div>
    <div class="asis-sug"></div>
    <form class="asis-form"><input type="text" maxlength="1000" placeholder="${t('rod_ph')}" aria-label="${t('rod_ph')}" required><button class="btn solid small" type="submit">${t('enviar')}</button></form>`;
  const msgs = caja.querySelector('.asis-msgs');
  const sug = caja.querySelector('.asis-sug');
  const form = caja.querySelector('form');
  const input = form.querySelector('input');

  const burbuja = (texto, quien) => {
    const d = document.createElement('div');
    d.className = 'asis-msg ' + quien;
    d.textContent = texto;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    return d;
  };
  burbuja(t('rod_hola'), 'bot');
  const sugerir = (lista) => {
    sug.innerHTML = '';
    (lista || []).forEach((q) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip-sug'; b.textContent = q;
      b.onclick = () => { input.value = q; form.requestSubmit(); };
      sug.appendChild(b);
    });
    msgs.scrollTop = msgs.scrollHeight;
  };
  sugerir(t('rod_sug'));

  async function pasarAlEquipo(texto, preguntaId, boton) {
    const pid = proyecto() || null;          // sin proyecto también llega al chat del cliente
    boton.disabled = true;
    const { data: nuevo, error } = await sb.from('comentarios').insert({ proyecto_id: pid, mensaje: t('rod_prefijo') + texto }).select('id').single();
    if (error) { boton.disabled = false; toast(t('rod_err_envio'), 'bad'); return; }
    sb.functions.invoke('analizar-comentario', { body: { comentario_id: nuevo.id } }).catch(() => {});
    if (preguntaId) sb.functions.invoke('asistente-chat', { body: { accion: 'enviada_equipo', pregunta_id: preguntaId } }).catch(() => {});
    boton.replaceWith(Object.assign(document.createElement('p'), { className: 'asis-ok', textContent: t('rod_pasada') }));
    document.dispatchEvent(new CustomEvent('asistente:enviado'));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = input.value.trim(); if (!texto) return;
    input.value = ''; sug.innerHTML = '';
    burbuja(texto, 'yo');
    const pensando = burbuja('…', 'bot pensando');
    form.querySelector('button').disabled = true;
    const { data, error } = await sb.functions.invoke('asistente-chat', {
      body: { pregunta: texto, historial: historial.slice(-6), proyecto_id: proyecto(), modo: modo(), prueba },
    });
    form.querySelector('button').disabled = false;
    pensando.remove();
    if (error || !data?.ok) {
      let msg = data?.error || t('rod_error');
      try { msg = (await error.context.json()).error || msg; } catch {}
      burbuja(msg, 'bot error');
      return;
    }
    const b = burbuja(data.respuesta, 'bot');
    historial.push({ rol: 'cliente', texto }, { rol: 'asistente', texto: data.respuesta });
    if (prueba) {
      const meta = document.createElement('p'); meta.className = 'asis-meta';
      meta.textContent = data.sabe ? '✓ Respondida con el conocimiento' : '⚠ No lo sabía: conviene enseñárselo';
      b.appendChild(meta);
    } else if (!data.sabe) {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn small';
      btn.textContent = t('rod_pasar');
      btn.onclick = () => pasarAlEquipo(texto, data.pregunta_id, btn);
      b.appendChild(btn);
    }
    sugerir(data.sugerencias);
    input.focus();
  });

  if (flotante) {
    const fab = document.createElement('button');
    fab.className = 'asis-fab'; fab.type = 'button'; fab.innerHTML = '✦ <span>Rodolfo</span>';
    fab.setAttribute('aria-label', t('rod_abrir'));
    fab.onclick = () => { caja.classList.toggle('oculto'); if (!caja.classList.contains('oculto')) input.focus(); };
    caja.querySelector('[data-cerrar]').onclick = () => caja.classList.add('oculto');
    document.body.append(caja, fab);
  } else {
    destino.innerHTML = ''; destino.appendChild(caja);
  }
}
