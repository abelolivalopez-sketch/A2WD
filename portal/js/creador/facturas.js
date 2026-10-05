// Gestión de facturas y presupuestos.
export function crearFacturas({
  sb, vista, esc, fecha, euros,
  fallo, tagFactura, abrirForm, camposFactura, guardarEn,
}) {
async function vFacturas() {
  const { data, error } = await sb.from('facturas').select('*, clientes(nombre,empresa)').order('fecha_emision', { ascending: false });
  if (fallo(error)) return;
  // Una factura pendiente cuyo vencimiento ya pasó cuenta y se muestra como vencida
  const d = new Date(), hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const estadoReal = (f) => (f.estado === 'pendiente' && f.fecha_vencimiento && f.fecha_vencimiento < hoy ? 'vencida' : f.estado);
  const suma = (e) => data.filter((f) => f.tipo === 'factura' && e.includes(estadoReal(f))).reduce((s, f) => s + Number(f.total), 0);
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Facturación</p><h1>Facturas y presupuestos</h1></div><button class="btn solid" id="nFac">+ Nueva</button></div>
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="card kpi"><p class="eyebrow">Cobrado</p><p class="v">${euros(suma(['pagada']))}</p></div>
      <div class="card kpi"><p class="eyebrow">Pendiente</p><p class="v">${euros(suma(['pendiente']))}</p></div>
      <div class="card kpi"><p class="eyebrow">Vencido</p><p class="v">${euros(suma(['vencida']))}</p></div>
    </div>
    <div class="card" style="padding:0"><div class="tabla-wrap"><table>
      <thead><tr><th>Número</th><th>Cliente</th><th>Concepto</th><th>Emisión</th><th>Base</th><th>Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>${data.length ? data.map((f) => `<tr>
        <td class="mono">${esc(f.numero || '—')}<br><span class="muted" style="font-size:11px">${f.tipo === 'presupuesto' ? 'Presupuesto' : 'Factura'}</span></td>
        <td><a href="#cliente/${f.cliente_id}">${esc(f.clientes?.nombre)}</a></td><td>${esc(f.concepto)}</td><td>${fecha(f.fecha_emision)}</td>
        <td class="mono">${euros(f.base)}</td><td class="mono"><strong>${euros(f.total)}</strong></td><td>${tagFactura(f.tipo === 'factura' ? estadoReal(f) : f.estado)}</td>
        <td><button class="btn small ghost" data-edit="${f.id}">Editar</button></td></tr>`).join('')
        : `<tr><td colspan="8"><div class="vacio" style="border:0">Aún no hay facturas.</div></td></tr>`}</tbody></table></div></div>`;
  document.getElementById('nFac').onclick = async () => abrirForm({ titulo: 'Nueva factura o presupuesto', campos: await camposFactura(), guardar: guardarEn('facturas') });
  vista.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = async () => {
    const f = data.find((x) => x.id === b.dataset.edit);
    const { total, clientes, ...valores } = f;
    abrirForm({ titulo: 'Editar ' + f.tipo, campos: await camposFactura(), valores, guardar: guardarEn('facturas', f.id) });
  }));
}



  return { vFacturas };
}
