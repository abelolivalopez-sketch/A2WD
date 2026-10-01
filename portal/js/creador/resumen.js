// Vista de resumen del panel creador.
export function crearResumen({
  sb, vista, perfil, esc, fecha, euros,
  tagEstado, tagsIA, iaDe,
  abrirForm, camposCliente, camposProyecto, guardarEn,
}) {
async function vResumen() {
  const [c, p, m, f] = await Promise.all([
    sb.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
    sb.from('proyectos').select('*, clientes(nombre)').neq('estado', 'entregado').order('fecha_entrega', { nullsFirst: false }),
    sb.from('comentarios').select('*, proyectos(nombre), comentarios_ia(*)').eq('leido', false).order('created_at', { ascending: false }).limit(8),
    sb.from('facturas').select('total').in('estado', ['pendiente', 'vencida']).eq('tipo', 'factura'),
  ]);
  const pendiente = (f.data || []).reduce((s, x) => s + Number(x.total), 0);
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Panel de creador</p><h1>Hola, ${esc(perfil.nombre || '')}</h1></div>
      <div class="acciones"><button class="btn" id="nCli">+ Cliente</button><button class="btn solid" id="nPro">+ Proyecto</button></div></div>
    <div class="kpis">
      <div class="card kpi"><p class="eyebrow">Clientes activos</p><p class="v">${c.count ?? 0}</p></div>
      <div class="card kpi"><p class="eyebrow">Proyectos en curso</p><p class="v">${p.data?.length ?? 0}</p></div>
      <div class="card kpi"><p class="eyebrow">Mensajes sin leer</p><p class="v">${m.data?.length ?? 0}</p></div>
      <div class="card kpi"><p class="eyebrow">Por cobrar</p><p class="v">${euros(pendiente)}</p></div>
    </div>
    <div class="dos">
      <div class="card"><h3>Proyectos en curso</h3>
        ${p.data?.length ? p.data.map((x) => `
          <div class="item" style="cursor:pointer" data-go="#proyecto/${x.id}">
            <div><p style="font-weight:600">${esc(x.nombre)}</p><p class="muted" style="font-size:13px">${esc(x.clientes?.nombre)} · entrega ${fecha(x.fecha_entrega)}</p>
              <div class="barra" style="width:160px;margin-top:8px"><i style="width:${x.progreso}%"></i></div></div>
            <div>${tagEstado(x.estado)}</div>
          </div>`).join('') : `<p class="muted" style="margin-top:10px">No hay proyectos en curso.</p>`}
      </div>
      <div class="card"><h3>Últimos mensajes sin leer</h3>
        ${m.data?.length ? m.data.map((x) => `
          <div class="item" style="cursor:pointer;display:block" data-go="#mensajes/${x.cliente_id}">
            <p class="mono muted" style="font-size:11.5px">${tagsIA(iaDe(x))}${esc(x.autor_nombre)}${x.proyectos?.nombre ? ' · ' + esc(x.proyectos.nombre) : ''} · ${fecha(x.created_at, true)}</p>
            <p style="margin-top:3px">${iaDe(x) ? '<strong>IA:</strong> ' + esc(iaDe(x).resumen) : esc(x.mensaje.length > 140 ? x.mensaje.slice(0, 140) + '…' : x.mensaje)}</p>
          </div>`).join('') : `<p class="muted" style="margin-top:10px">Estás al día.</p>`}
      </div>
    </div>`;
  document.getElementById('nCli').onclick = () => abrirForm({ titulo: 'Nuevo cliente', campos: camposCliente, guardar: guardarEn('clientes') });
  document.getElementById('nPro').onclick = async () => abrirForm({ titulo: 'Nuevo proyecto', campos: await camposProyecto(), guardar: guardarEn('proyectos') });
}


  return { vResumen };
}
