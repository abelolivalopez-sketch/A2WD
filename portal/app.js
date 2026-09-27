// Utilidades compartidas del portal A2WD
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

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
  return f.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}) });
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
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace('login.html'); return null; }
  const { data: perfil, error } = await sb.from('perfiles').select('*').eq('id', session.user.id).single();
  if (error || !perfil) { await sb.auth.signOut(); location.replace('login.html?e=perfil'); return null; }
  if (rolRequerido && perfil.rol !== rolRequerido) {
    location.replace(perfil.rol === 'creador' ? 'creador.html' : 'cliente.html');
    return null;
  }
  return { session, perfil };
}

export async function salir() {
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
      <div class="dlg-head"><h3>Cambiar contraseña</h3><button type="button" class="x" data-cerrar aria-label="Cerrar">×</button></div>
      <div class="dlg-body">
        <div class="campo"><label for="pwN1">Nueva contraseña</label><input id="pwN1" type="password" autocomplete="new-password" minlength="8" required></div>
        <div class="campo"><label for="pwN2">Repítela</label><input id="pwN2" type="password" autocomplete="new-password" minlength="8" required></div>
        <p class="muted" style="font-size:13px">Mínimo 8 caracteres.</p>
        <p class="error" id="pwErr"></p>
      </div>
      <div class="dlg-foot"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button type="submit" class="btn solid">Guardar</button></div>
    </form>`;
  document.body.appendChild(dlg);
  dlg.querySelectorAll('[data-cerrar]').forEach((b) => (b.onclick = () => dlg.close()));
  btn.onclick = () => { dlg.querySelector('form').reset(); dlg.querySelector('#pwErr').textContent = ''; dlg.showModal(); };
  dlg.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = dlg.querySelector('#pwN1').value, p2 = dlg.querySelector('#pwN2').value;
    const err = dlg.querySelector('#pwErr');
    if (p1 !== p2) { err.textContent = 'Las contraseñas no coinciden.'; return; }
    const b = e.target.querySelector('[type=submit]'); b.disabled = true;
    const { error } = await sb.auth.updateUser({ password: p1 });
    b.disabled = false;
    if (error) { err.textContent = 'No se pudo cambiar: ' + error.message; return; }
    dlg.close();
    toast('Contraseña actualizada');
  });
}

// =====================================================================
//  Asistente IA (chat). Flotante en el panel del cliente o incrustado
//  en el panel del creador para probarlo.
// =====================================================================
export function chatAsistente({ destino = null, proyecto = () => null, prueba = false } = {}) {
  const historial = [];
  const flotante = !destino;
  const caja = document.createElement('div');
  caja.className = 'asis-panel' + (flotante ? ' flotante oculto' : '');
  caja.innerHTML = `
    <div class="asis-cab">
      <div><strong>✦ Asistente A2WD</strong><p class="muted">Responde al momento · Écris dans ta langue · Write in your language</p></div>
      ${flotante ? '<button class="x" data-cerrar aria-label="Cerrar">×</button>' : ''}
    </div>
    <div class="asis-msgs" aria-live="polite"></div>
    <div class="asis-sug"></div>
    <form class="asis-form"><input type="text" maxlength="1000" placeholder="Escribe tu pregunta…" aria-label="Pregunta" required><button class="btn solid small" type="submit">Enviar</button></form>`;
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
  burbuja('¡Hola! Soy el asistente de A2WD. Pregúntame sobre tu proyecto o sobre cómo funciona el portal.', 'bot');
  ['¿Cómo va mi web?', '¿Cómo pido un cambio?', '¿Qué significa la fase actual?'].forEach((t) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip-sug'; b.textContent = t;
    b.onclick = () => { input.value = t; form.requestSubmit(); };
    sug.appendChild(b);
  });

  async function pasarAlEquipo(texto, preguntaId, boton) {
    const pid = proyecto();
    if (!pid) { toast('No hay proyecto al que enviar la pregunta', 'bad'); return; }
    boton.disabled = true;
    const { data: nuevo, error } = await sb.from('comentarios').insert({ proyecto_id: pid, mensaje: '[Pregunta al asistente] ' + texto }).select('id').single();
    if (error) { boton.disabled = false; toast('No se pudo enviar', 'bad'); return; }
    sb.functions.invoke('analizar-comentario', { body: { comentario_id: nuevo.id } }).catch(() => {});
    if (preguntaId) sb.functions.invoke('asistente-chat', { body: { accion: 'enviada_equipo', pregunta_id: preguntaId } }).catch(() => {});
    boton.replaceWith(Object.assign(document.createElement('p'), { className: 'asis-ok', textContent: '✓ Enviada al equipo. Te responderán en "Dudas y comentarios".' }));
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
      body: { pregunta: texto, historial: historial.slice(-6), proyecto_id: proyecto(), prueba },
    });
    form.querySelector('button').disabled = false;
    pensando.remove();
    if (error || !data?.ok) {
      let msg = data?.error || 'No he podido responder ahora mismo. Inténtalo en un momento.';
      try { msg = (await error.context.json()).error || msg; } catch {}
      burbuja(msg, 'bot error');
      return;
    }
    const b = burbuja(data.respuesta, 'bot');
    historial.push({ rol: 'cliente', texto }, { rol: 'asistente', texto: data.respuesta });
    if (prueba) {
      const t = document.createElement('p'); t.className = 'asis-meta';
      t.textContent = data.sabe ? '✓ Respondida con el conocimiento' : '⚠ No lo sabía: conviene enseñárselo';
      b.appendChild(t);
    } else if (!data.sabe) {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn small';
      btn.textContent = 'Pasar la pregunta al equipo';
      btn.onclick = () => pasarAlEquipo(texto, data.pregunta_id, btn);
      b.appendChild(btn);
    }
    msgs.scrollTop = msgs.scrollHeight;
    input.focus();
  });

  if (flotante) {
    const fab = document.createElement('button');
    fab.className = 'asis-fab'; fab.type = 'button'; fab.innerHTML = '✦ <span>Asistente</span>';
    fab.setAttribute('aria-label', 'Abrir asistente');
    fab.onclick = () => { caja.classList.toggle('oculto'); if (!caja.classList.contains('oculto')) input.focus(); };
    caja.querySelector('[data-cerrar]').onclick = () => caja.classList.add('oculto');
    document.body.append(caja, fab);
  } else {
    destino.innerHTML = ''; destino.appendChild(caja);
  }
}
