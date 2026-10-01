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
import { crearAsistente } from './creador/asistente.js';

// ---------------------------------------------------------------------
// Arranque del panel creador
// ---------------------------------------------------------------------
document.getElementById('logo').insertAdjacentHTML('afterbegin', LOGO);

const ctx = await exigirSesion('creador');
if (!ctx) throw new Error('Sin sesión');

const { perfil } = ctx;
const vista = document.getElementById('vista');

document.getElementById('quien').textContent = perfil.nombre || perfil.email;
document.getElementById('salir').onclick = salir;

idiomaMovil('es');
botonAvisos(document.getElementById('avisos'), sb);
avisosAlAbrir(sb, { creador: true });
activarCambioPassword();

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

const { vResumen } = crearResumen({
  sb, vista, perfil, esc, fecha, euros,
  tagEstado, tagsIA, iaDe,
  abrirForm, camposCliente, camposProyecto, guardarEn,
});

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

const { vAsistente, actualizarAsis } = crearAsistente({
  sb, vista, esc, fecha, chatAsistente,
  fallo, opts, abrirForm, guardarEn, borrar, refrescar,
});

// ---------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------
async function router() {
  const [seccion, id] = (location.hash.slice(1) || 'resumen').split('/');
  const menu = { cliente: 'clientes', proyecto: 'proyectos' }[seccion] || seccion;

  document.querySelectorAll('#side a')
    .forEach((a) => a.classList.toggle('on', a.dataset.s === menu));

  const vistas = {
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
    asistente: vAsistente,
  };

  await (vistas[seccion] || vResumen)(id);
  actualizarSinLeer();
  actualizarAsis();
  actualizarEquipo();
}

// Clics en filas/tarjetas con data-go
vista.addEventListener('click', (e) => {
  if (e.target.closest('a,button')) return;
  const go = e.target.closest('[data-go]');
  if (go) location.hash = go.dataset.go;
});

window.addEventListener('hashchange', () => {
  router();
  window.scrollTo(0, 0);
});

router();
