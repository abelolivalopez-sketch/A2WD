// Utilidades y formularios compartidos del panel creador.
export function crearUi({ sb, esc, toast, ESTADOS, refrescar }) {
const ESTADOS_CLIENTE = { potencial: 'Potencial', activo: 'Activo', pausado: 'Pausado', antiguo: 'Antiguo' };
const ESTADOS_FACTURA = { borrador: 'Borrador', pendiente: 'Pendiente', pagada: 'Pagada', vencida: 'Vencida', anulada: 'Anulada' };
const tagEstado = (e) => `<span class="tag ${e === 'entregado' ? 'ok' : e === 'revision' ? 'warn' : ''}">${ESTADOS[e] || e}</span>`;
const tagFactura = (e) => `<span class="tag ${e === 'pagada' ? 'ok' : e === 'vencida' ? 'bad' : e === 'pendiente' ? 'warn' : ''}">${ESTADOS_FACTURA[e] || e}</span>`;
const opts = (obj) => Object.entries(obj).map(([v, l]) => ({ v, l }));
const fallo = (error, texto = 'Algo salió mal') => { if (error) { console.error(error); toast(`${texto}: ${error.message}`, 'bad'); return true; } return false; };

// ---------- Formulario genérico en diálogo ----------
const dlg = document.getElementById('dlg');
let onGuardar = null;
function abrirForm({ titulo, campos, valores = {}, guardar }) {
  document.getElementById('dlgTitulo').textContent = titulo;
  document.getElementById('dlgCampos').innerHTML = campos.map((c) => {
    const v = valores[c.k] ?? c.def ?? '';
    const req = c.req ? 'required' : '';
    let input;
    if (c.tipo === 'textarea') input = `<textarea name="${c.k}" ${req}>${esc(v)}</textarea>`;
    else if (c.tipo === 'select') input = `<select name="${c.k}" ${req}>${c.opciones.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
    else input = `<input name="${c.k}" type="${c.tipo || 'text'}" value="${esc(v)}" ${c.attrs || ''} ${req}>`;
    return `<div class="campo"><label>${esc(c.label)}${c.req ? ' *' : ''}</label>${input}</div>`;
  }).join('');
  onGuardar = async (datos) => guardar(datos);
  dlg.showModal();
}
const cerrar = () => dlg.close();
document.getElementById('dlgX').onclick = cerrar;
document.getElementById('dlgCancelar').onclick = cerrar;
document.getElementById('dlgForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(e.target));
  for (const k in datos) if (datos[k] === '') datos[k] = null;
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true;
  const ok = await onGuardar(datos);
  btn.disabled = false;
  if (ok !== false) { cerrar(); refrescar(); }
});

// ---------- Definición de formularios ----------
const camposCliente = [
  { k: 'nombre', label: 'Nombre de contacto', req: true },
  { k: 'email', label: 'Correo (con el que entrará al portal)', tipo: 'email', req: true },
  { k: 'empresa', label: 'Empresa / negocio' },
  { k: 'telefono', label: 'Teléfono', tipo: 'tel' },
  { k: 'nif', label: 'NIF / CIF' },
  { k: 'direccion', label: 'Dirección fiscal' },
  { k: 'servicios', label: 'Servicios contratados', attrs: 'placeholder="Web, mantenimiento, hosting…"' },
  { k: 'estado', label: 'Estado', tipo: 'select', opciones: opts(ESTADOS_CLIENTE), def: 'activo' },
  { k: 'notas_privadas', label: 'Notas privadas (el cliente no las ve)', tipo: 'textarea' },
];
async function camposProyecto() {
  const { data: clientes } = await sb.from('clientes').select('id,nombre,empresa').order('nombre');
  return [
    { k: 'cliente_id', label: 'Cliente', tipo: 'select', req: true, opciones: (clientes || []).map((c) => ({ v: c.id, l: c.empresa ? `${c.nombre} · ${c.empresa}` : c.nombre })) },
    { k: 'nombre', label: 'Nombre del proyecto', req: true },
    { k: 'descripcion', label: 'Descripción (la ve el cliente)', tipo: 'textarea' },
    { k: 'url_preview', label: 'Enlace de vista previa', tipo: 'url', attrs: 'placeholder="https://…"' },
    { k: 'estado', label: 'Fase', tipo: 'select', opciones: opts(ESTADOS), def: 'diseno' },
    { k: 'progreso', label: 'Progreso (%)', tipo: 'number', attrs: 'min="0" max="100"', def: 0 },
    { k: 'fecha_entrega', label: 'Fecha de entrega prevista', tipo: 'date' },
  ];
}
async function camposFactura(clienteFijo) {
  const [{ data: clientes }, { data: proyectos }] = await Promise.all([
    sb.from('clientes').select('id,nombre,empresa').order('nombre'),
    sb.from('proyectos').select('id,nombre').order('nombre'),
  ]);
  return [
    { k: 'cliente_id', label: 'Cliente', tipo: 'select', req: true, def: clienteFijo, opciones: (clientes || []).map((c) => ({ v: c.id, l: c.empresa ? `${c.nombre} · ${c.empresa}` : c.nombre })) },
    { k: 'proyecto_id', label: 'Proyecto', tipo: 'select', opciones: [{ v: '', l: '— Ninguno —' }, ...(proyectos || []).map((p) => ({ v: p.id, l: p.nombre }))] },
    { k: 'tipo', label: 'Tipo', tipo: 'select', opciones: [{ v: 'factura', l: 'Factura' }, { v: 'presupuesto', l: 'Presupuesto' }] },
    { k: 'numero', label: 'Número', attrs: 'placeholder="2026-001"' },
    { k: 'concepto', label: 'Concepto', req: true },
    { k: 'base', label: 'Base imponible (€)', tipo: 'number', attrs: 'step="0.01" min="0"', req: true },
    { k: 'iva_pct', label: 'IVA (%)', tipo: 'number', attrs: 'step="0.01" min="0"', def: 21 },
    { k: 'estado', label: 'Estado', tipo: 'select', opciones: opts(ESTADOS_FACTURA), def: 'pendiente' },
    { k: 'fecha_emision', label: 'Fecha de emisión', tipo: 'date', def: new Date().toISOString().slice(0, 10) },
    { k: 'fecha_vencimiento', label: 'Vencimiento', tipo: 'date' },
  ];
}

const guardarEn = (tabla, id) => async (datos) => {
  const q = id ? sb.from(tabla).update(datos).eq('id', id) : sb.from(tabla).insert(datos);
  const { error } = await q;
  if (fallo(error, 'No se pudo guardar')) return false;
  toast('Guardado');
};
async function borrar(tabla, id, texto, despues) {
  if (!confirm(`¿Seguro que quieres borrar ${texto}? No se puede deshacer.`)) return;
  const { error } = await sb.from(tabla).delete().eq('id', id);
  if (fallo(error, 'No se pudo borrar')) return;
  toast('Borrado');
  if (despues) location.hash = despues; else refrescar();
}

// ---------- Invitar al portal ----------
async function invitar(email) {
  const redirectTo = new URL('login.html', location.href).href;
  const { data, error } = await sb.functions.invoke('invitar-cliente', { body: { email, redirectTo } });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context.json()).error || msg; } catch {}
    toast('No se pudo invitar: ' + msg, 'bad');
    return;
  }
  if (data?.ok) toast('Invitación enviada a ' + email);
}


  return {
    ESTADOS_CLIENTE,
    ESTADOS_FACTURA,
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
  };
}
