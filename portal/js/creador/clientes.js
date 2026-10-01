// Gestión de clientes y ficha individual.
export function crearClientes({
  sb, vista, esc, fecha, euros,
  fallo, opts, ESTADOS_CLIENTE,
  tagEstado, tagFactura,
  abrirForm, camposCliente, camposProyecto, camposFactura,
  guardarEn, borrar, invitar,
}) {
async function vClientes() {
  const { data, error } = await sb.from('clientes').select('*, proyectos(count)').order('created_at', { ascending: false });
  if (fallo(error)) return;
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Base de datos</p><h1>Clientes</h1></div><button class="btn solid" id="nCli">+ Nuevo cliente</button></div>
    <div class="herr"><input id="buscar" type="search" placeholder="Buscar nombre, empresa, correo…">
      <select id="filtro"><option value="">Todos los estados</option>${opts(ESTADOS_CLIENTE).map((o) => `<option value="${o.v}">${o.l}</option>`).join('')}</select></div>
    <div class="card" style="padding:0"><div class="tabla-wrap"><table>
      <thead><tr><th>Cliente</th><th>Contacto</th><th>Servicios</th><th>Proyectos</th><th>Portal</th><th>Estado</th></tr></thead>
      <tbody id="filas"></tbody></table></div></div>`;
  const pintar = () => {
    const t = document.getElementById('buscar').value.toLowerCase();
    const f = document.getElementById('filtro').value;
    const lista = data.filter((c) => (!f || c.estado === f) && [c.nombre, c.empresa, c.email, c.telefono, c.nif].join(' ').toLowerCase().includes(t));
    document.getElementById('filas').innerHTML = lista.length ? lista.map((c) => `
      <tr class="click" data-go="#cliente/${c.id}">
        <td><strong>${esc(c.nombre)}</strong><br><span class="muted" style="font-size:13px">${esc(c.empresa || '')}</span></td>
        <td>${esc(c.email)}<br><span class="muted" style="font-size:13px">${esc(c.telefono || '')}</span></td>
        <td>${esc(c.servicios || '—')}</td>
        <td class="mono">${c.proyectos?.[0]?.count ?? 0}</td>
        <td>${c.user_id ? '<span class="tag ok">Activo</span>' : '<span class="tag">Sin invitar</span>'}</td>
        <td><span class="tag ${c.estado === 'activo' ? 'dark' : ''}">${ESTADOS_CLIENTE[c.estado]}</span></td>
      </tr>`).join('') : `<tr><td colspan="6"><div class="vacio" style="border:0">${data.length ? 'Sin resultados' : 'Aún no hay clientes. Crea el primero.'}</div></td></tr>`;
  };
  document.getElementById('buscar').oninput = pintar;
  document.getElementById('filtro').onchange = pintar;
  pintar();
  document.getElementById('nCli').onclick = () => abrirForm({ titulo: 'Nuevo cliente', campos: camposCliente, guardar: guardarEn('clientes') });
}

async function vCliente(id) {
  const [{ data: c, error }, { data: proyectos }, { data: facturas }] = await Promise.all([
    sb.from('clientes').select('*').eq('id', id).single(),
    sb.from('proyectos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
    sb.from('facturas').select('*').eq('cliente_id', id).order('fecha_emision', { ascending: false }),
  ]);
  if (fallo(error, 'Cliente no encontrado')) return;
  const facturado = (facturas || []).filter((f) => f.tipo === 'factura' && f.estado === 'pagada').reduce((s, f) => s + Number(f.total), 0);
  vista.innerHTML = `
    <a class="volver" href="#clientes">← Clientes</a>
    <div class="cabecera"><div><p class="eyebrow">${esc(c.empresa || 'Cliente')}</p><h1>${esc(c.nombre)}</h1></div>
      <div class="acciones">
        ${c.user_id ? '<span class="tag ok" style="align-self:center">Acceso al portal activo</span>' : `<button class="btn solid" id="inv">Invitar al portal</button>`}
        <button class="btn" id="edit">Editar</button><button class="btn danger" id="del">Borrar</button></div></div>
    <div class="dos">
      <div class="stack">
        <div class="card"><h3 style="margin-bottom:14px">Datos</h3><dl class="datos">
          <dt>Correo</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>
          <dt>Teléfono</dt><dd>${c.telefono ? `<a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a>` : '—'}</dd>
          <dt>NIF / CIF</dt><dd>${esc(c.nif || '—')}</dd>
          <dt>Dirección</dt><dd>${esc(c.direccion || '—')}</dd>
          <dt>Servicios</dt><dd>${esc(c.servicios || '—')}</dd>
          <dt>Estado</dt><dd>${ESTADOS_CLIENTE[c.estado]}</dd>
          <dt>Alta</dt><dd>${fecha(c.created_at)}</dd>
          <dt>Facturado</dt><dd class="mono">${euros(facturado)}</dd>
        </dl></div>
        <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Proyectos</h3><button class="btn small" id="nPro">+ Proyecto</button></div>
          ${proyectos?.length ? proyectos.map((p) => `
            <div class="item" style="cursor:pointer" data-go="#proyecto/${p.id}"><div><p style="font-weight:600">${esc(p.nombre)}</p><p class="muted" style="font-size:13px">${p.progreso}% · entrega ${fecha(p.fecha_entrega)}</p></div>${tagEstado(p.estado)}</div>`).join('')
            : `<p class="muted" style="margin-top:10px">Sin proyectos todavía.</p>`}
        </div>
      </div>
      <div class="stack">
        <div class="card"><h3 style="margin-bottom:10px">Notas privadas</h3><p style="white-space:pre-wrap" class="${c.notas_privadas ? '' : 'muted'}">${esc(c.notas_privadas || 'Sin notas.')}</p></div>
        <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Facturas y presupuestos</h3><button class="btn small" id="nFac">+ Nueva</button></div>
          ${facturas?.length ? facturas.map((f) => `
            <div class="item"><div><p style="font-weight:600">${esc(f.numero || (f.tipo === 'presupuesto' ? 'Presupuesto' : 'Factura'))}</p><p class="muted" style="font-size:13px">${esc(f.concepto)} · ${fecha(f.fecha_emision)}</p></div>
              <div style="text-align:right"><p class="mono">${euros(f.total)}</p>${tagFactura(f.estado)}</div></div>`).join('')
            : `<p class="muted" style="margin-top:10px">Sin facturas.</p>`}
        </div>
      </div>
    </div>`;
  document.getElementById('edit').onclick = () => abrirForm({ titulo: 'Editar cliente', campos: camposCliente, valores: c, guardar: guardarEn('clientes', id) });
  document.getElementById('del').onclick = () => borrar('clientes', id, `a ${c.nombre} y todos sus proyectos`, '#clientes');
  document.getElementById('inv')?.addEventListener('click', async (e) => { e.target.disabled = true; await invitar(c.email); e.target.disabled = false; });
  document.getElementById('nPro').onclick = async () => abrirForm({ titulo: 'Nuevo proyecto', campos: await camposProyecto(), valores: { cliente_id: id }, guardar: guardarEn('proyectos') });
  document.getElementById('nFac').onclick = async () => abrirForm({ titulo: 'Nueva factura o presupuesto', campos: await camposFactura(id), guardar: guardarEn('facturas') });
}


  return { vClientes, vCliente };
}
