import { sb, configurado, avisoSinConfigurar, toast, LOGO, t, selectorIdioma } from './app.js';
import { sesionGuardada, leerCopia } from './movil.js';
import { SUPABASE_URL } from './config.js';

document.querySelectorAll('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t)));
selectorIdioma(document.getElementById('idioma'));

document.getElementById('logo').insertAdjacentHTML('afterbegin', LOGO);
if (!configurado) { avisoSinConfigurar(); throw new Error('Sin configurar'); }

const $ = (id) => document.getElementById(id);
const ver = (id) => ['vLogin', 'vRecuperar', 'vPassword'].forEach((v) => $(v).classList.toggle('oculto', v !== id));

async function entrarSegunRol(userId) {
  let { data: perfil } = await sb.from('perfiles').select('rol').eq('id', userId).single();
  if (!perfil) perfil = leerCopia(userId, 'perfil')?.datos;  // sin conexión
  location.replace(perfil?.rol === 'creador' ? 'creador.html' : 'cliente.html');
}

function cargando(form, on) { form.querySelector('button[type=submit]').disabled = on; }

// ¿Viene de un enlace del correo?
if (window.__errorEnlace) {
  $('errLogin').textContent = t('err_enlace');
} else if (window.__tipoEnlace === 'invite' || window.__tipoEnlace === 'recovery') {
  if (window.__tipoEnlace === 'recovery') { $('pwEyebrow').textContent = t('rec_eyebrow'); $('pwTitulo').textContent = t('nueva_pw_titulo'); }
  ver('vPassword');
} else {
  let { data: { session } } = await sb.auth.getSession();
  if (!session && !navigator.onLine) session = sesionGuardada(SUPABASE_URL);  // app abierta sin internet
  if (session && new URLSearchParams(location.search).get('e') !== 'perfil') entrarSegunRol(session.user.id);
}
if (new URLSearchParams(location.search).get('e') === 'perfil') {
  $('errLogin').textContent = t('err_perfil');
}

$('fLogin').addEventListener('submit', async (e) => {
  e.preventDefault(); cargando(e.target, true); $('errLogin').textContent = '';
  const { data, error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('pass').value });
  cargando(e.target, false);
  if (error) { $('errLogin').textContent = t('err_login'); return; }
  entrarSegunRol(data.user.id);
});

$('irRecuperar').onclick = (e) => { e.preventDefault(); $('emailRec').value = $('email').value; ver('vRecuperar'); };
$('volver').onclick = (e) => { e.preventDefault(); ver('vLogin'); };

$('fRecuperar').addEventListener('submit', async (e) => {
  e.preventDefault(); cargando(e.target, true);
  const redirectTo = location.origin + location.pathname;
  await sb.auth.resetPasswordForEmail($('emailRec').value.trim(), { redirectTo });
  cargando(e.target, false);
  // Mismo mensaje exista o no la cuenta, para no revelar correos
  toast(t('toast_rec'));
  ver('vLogin');
});

$('fPassword').addEventListener('submit', async (e) => {
  e.preventDefault(); $('errPw').textContent = '';
  if ($('pw1').value !== $('pw2').value) { $('errPw').textContent = t('no_coinciden'); return; }
  cargando(e.target, true);
  const { data, error } = await sb.auth.updateUser({ password: $('pw1').value });
  cargando(e.target, false);
  if (error) { $('errPw').textContent = t('err_guardar_pw', { e: error.message }); return; }
  history.replaceState(null, '', location.pathname);
  entrarSegunRol(data.user.id);
});
