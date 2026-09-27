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
  await sb.auth.signOut();
  location.replace('login.html');
}

export const LOGO = `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50,50 C50,35 38,22 24,22 C11,22 2,33 2,47 C2,61 11,72 24,72 C38,72 50,59 50,50 C50,35 62,22 76,22 C89,22 98,33 98,47 C98,61 89,72 76,72 C62,72 50,59 50,50 Z" stroke="currentColor" stroke-width="7"/></svg>`;
