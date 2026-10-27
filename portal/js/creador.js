import {
  sb, exigirSesion, salir, esc, urlSegura, fecha, euros, toast,
  ESTADOS, ORDEN_ESTADOS, LOGO, activarCambioPassword, chatAsistente,
} from './app.js';
import { botonAvisos, idiomaMovil, avisosAlAbrir } from './movil.js';

import { crearUi } from './creador/ui.js';
import { crearComentarios } from './creador/comentarios.js';
import { crearResumen } from './creador/resumen.js';
import { crearClientes } from './creador/clientes.js';
import { crearProyectos } from './creador/proyectos.js';
import { crearMensajes } from './creador/mensajes.js';
import { crearFacturas } from './creador/facturas.js';
import { crearGestionTarifas } from './creador/gestion-tarifas.js';
import { crearEquipo } from './creador/equipo.js';
import { crearPortfolio } from './creador/portfolio.js';
import { crearActividad } from './creador/actividad.js';
import { crearAsistente } from './creador/asistente.js';
import { crearBarra } from './creador/barra.js';
import { crearAjustes, aplicarPreferencias } from './creador/ajustes.js';

// ---------------------------------------------------------------------
// Arranque del panel creador
// ---------------------------------------------------------------------
aplicarPreferencias();
document.getElementById('logo').insertAdjacentHTML('afterbegin', LOGO);

const ctx = await exigirSesion('creador');
if (!ctx) throw new Error('Sin sesión');

const { perfil } = ctx;
try { localStorage.setItem('a2wd_equipo', '1'); } catch {}
const vista = document.getElementById('vista');

document.getElementById('salir').onclick = salir;

idiomaMovil('es');
botonAvisos(document.getElementById('avisos'), sb);
avisosAlAbrir(sb, { creador: true });

// Pantalla con la que se abre el panel (se elige en Ajustes)
const INICIO = (() => { try { return localStorage.getItem('a2wd_inicio') || 'resumen'; } catch { return 'resumen'; } })();

// Los módulos reciben solo las dependencias que necesitan.
// refrescar() conserva el comportamiento anterior: volver a ejecutar el router.
const refrescar = () => router();

const {
  ESTADOS_CLIENTE,
  tagEstado,
  tagFactura,
  opts,
  fallo,
  abrirForm,
  camposCliente,
  camposProyecto,
  camposFactura,
  guardarEn,
  borrar,
  invitar,
} = crearUi({ sb, esc, toast, ESTADOS, refrescar });

const {
  iaDe,
  tagsIA,
  bloqueIA,
  analizar,
  actualizarSinLeer,
} = crearComentarios({ sb, esc, toast, refrescar });

const { pintarPerfil } = crearBarra({ sb, esc, euros, perfil, ESTADOS });

const { vResumen } = crearResumen({ sb, vista, perfil, esc, euros, ESTADOS, iaDe });

const { vAjustes } = crearAjustes({ sb, vista, perfil, esc, toast, fallo, salir, botonAvisos, activarCambioPassword, pintarPerfil });

const { vClientes, vCliente } = crearClientes({
  sb, vista, esc, fecha, euros,
  fallo, opts, ESTADOS_CLIENTE,
  tagEstado, tagFactura,
  abrirForm, camposCliente, camposProyecto, camposFactura,
  guardarEn, borrar, invitar,
});

const { vProyectos, vProyecto } = crearProyectos({
  sb, vista, esc, urlSegura, fecha, toast, ESTADOS, ORDEN_ESTADOS,
  tagEstado, fallo, abrirForm, camposProyecto, guardarEn, borrar,
  bloqueIA, analizar, iaDe, actualizarSinLeer, refrescar,
});

const { vMensajes } = crearMensajes({
  sb, vista, esc, fecha, toast, perfil,
  fallo, iaDe, tagsIA, analizar, actualizarSinLeer,
});

const { vFacturas } = crearFacturas({
  sb, vista, esc, fecha, euros,
  fallo, tagFactura, abrirForm, camposFactura, guardarEn,
});

const { vTarifas } = crearGestionTarifas({
  sb, vista, perfil, esc, fecha, euros, toast, fallo,
  abrirForm, camposFactura, guardarEn,
});

const { vEquipo, actualizarEquipo } = crearEquipo({
  sb, vista, esc, perfil, fallo, toast, ESTADOS,
});

const { vWeb } = crearPortfolio({
  sb, vista, esc, toast, fallo,
});

const { vActividad } = crearActividad({ sb, vista, esc, toast });

const { vAsistente, actualizarAsis } = crearAsistente({
  sb, vista, esc, fecha, chatAsistente,
  fallo, opts, abrirForm, guardarEn, borrar, refrescar,
});

// ---------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------
const VISTAS = {
  resumen: vResumen,
  clientes: vClientes,
  cliente: vCliente,
  proyectos: vProyectos,
  proyecto: vProyecto,
  mensajes: vMensajes,
  facturas: vFacturas,
  tarifas: vTarifas,
  equipo: vEquipo,
  web: vWeb,
  actividad: vActividad,
  asistente: vAsistente,
  ajustes: vAjustes,
};
const MENU_DE = { cliente: 'clientes', proyecto: 'proyectos' };
const side = document.getElementById('side');
let pedida = 0;
let cola = Promise.resolve();

function marcarMenu(seccion) {
  const menu = MENU_DE[seccion] || seccion;
  let activo = null;
  side.querySelectorAll('a').forEach((a) => {
    const on = a.dataset.s === menu;
    a.classList.toggle('on', on);
    if (on) { a.setAttribute('aria-current', 'page'); activo = a; } else a.removeAttribute('aria-current');
  });
  if (!activo || side.scrollWidth <= side.clientWidth) return;
  const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  side.scrollTo({ left: activo.offsetLeft - (side.clientWidth - activo.offsetWidth) / 2, behavior: suave ? 'smooth' : 'auto' });
}

async function pintar(seccion, id) {
  try { await (VISTAS[seccion] || vResumen)(id); } catch (e) { console.error(e); }
  actualizarSinLeer();
  actualizarAsis();
  actualizarEquipo();
}

function router({ arriba = false } = {}) {
  const [seccion, id] = (location.hash.slice(1) || INICIO).split('/');
  const turno = ++pedida;
  marcarMenu(seccion);
  if (arriba) vista.setAttribute('aria-busy', 'true');
  cola = cola.then(async () => {
    if (turno !== pedida) return;
    await pintar(seccion, id);
    if (turno !== pedida) return;
    vista.removeAttribute('aria-busy');
    if (!arriba) return;
    window.scrollTo(0, 0);
    vista.focus({ preventScroll: true });
  });
  return cola;
}

vista.addEventListener('click', (e) => {
  if (e.target.closest('a,button')) return;
  const go = e.target.closest('[data-go]');
  if (go) location.hash = go.dataset.go;
});

window.addEventListener('hashchange', () => router({ arriba: true }));

router();
