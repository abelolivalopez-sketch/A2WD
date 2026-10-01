// Gestión de proyectos, avances y conversación asociada al proyecto.
export function crearProyectos({
  sb, vista, esc, urlSegura, fecha, toast, ESTADOS, ORDEN_ESTADOS,
  tagEstado, fallo, abrirForm, camposProyecto, guardarEn, borrar,
  bloqueIA, analizar, iaDe, actualizarSinLeer, refrescar,
}) {
async function vProyectos() {
  const { data, error } = await sb.from('proyectos').select('*, clientes(nombre,empresa)').order('created_at', { ascending: false });
  if (fallo(error)) return;
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Trabajo</p><h1>Proyectos</h1></div><button class="btn solid" id="nPro">+ Nuevo proyecto</button></div>
    <div class="card" style="padding:0"><div class="tabla-wrap"><table>
      <thead><tr><th>Proyecto</th><th>Cliente</th><th>Fase</th><th>Progreso</th><th>Entrega</th><th>Vista previa</th></tr></thead>
      <tbody>${data.length ? data.map((p) => {
        const u = urlSegura(p.url_preview);
        return `<tr class="click" data-go="#proyecto/${p.id}">
          <td><strong>${esc(p.nombre)}</strong></td><td>${esc(p.clientes?.nombre)}</td><td>${tagEstado(p.estado)}</td>
          <td><div class="barra" style="width:90px;display:inline-block;vertical-align:middle"><i style="width:${p.progreso}%"></i></div> <span class="mono" style="font-size:12px">${p.progreso}%</span></td>
          <td>${fecha(p.fecha_entrega)}</td>
          <td>${u ? `<a class="mono" style="font-size:13px" href="${esc(u)}" target="_blank" rel="noopener" data-stop>Abrir ↗</a>` : '—'}</td></tr>`;
      }).join('') : `<tr><td colspan="6"><div class="vacio" style="border:0">Aún no hay proyectos.</div></td></tr>`}</tbody></table></div></div>`;
  document.getElementById('nPro').onclick = async () => abrirForm({ titulo: 'Nuevo proyecto', campos: await camposProyecto(), guardar: guardarEn('proyectos') });
}

async function vProyecto(id) {
  const [{ data: p, error }, { data: avances }, { data: comentarios }] = await Promise.all([
    sb.from('proyectos').select('*, clientes(id,nombre,email,user_id)').eq('id', id).single(),
    sb.from('avances').select('*').eq('proyecto_id', id).order('created_at', { ascending: false }),
    sb.from('comentarios').select('*, comentarios_ia(*)').eq('proyecto_id', id).order('created_at'),
  ]);
  if (fallo(error, 'Proyecto no encontrado')) return;
  const u = urlSegura(p.url_preview);
  const idx = ORDEN_ESTADOS.indexOf(p.estado);
  const enlacePortal = new URL('login.html', location.href).href;
  vista.innerHTML = `
    <a class="volver" href="#cliente/${p.clientes.id}">← ${esc(p.clientes.nombre)}</a>
    <div class="cabecera"><div><p class="eyebrow">Proyecto</p><h1>${esc(p.nombre)}</h1></div>
      <div class="acciones">${u ? `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Ver web ↗</a>` : ''}
        <button class="btn" id="copiar">Copiar enlace del portal</button>
        <button class="btn" id="edit">Editar</button><button class="btn danger" id="del">Borrar</button></div></div>
    ${!p.clientes.user_id ? `<div class="card" style="margin-bottom:18px;border-color:var(--warn)"><p><strong>El cliente aún no tiene acceso al portal.</strong> <span class="muted">Invítale desde su ficha para que pueda ver este proyecto.</span></p></div>` : ''}
    <div class="dos">
      <div class="stack">
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><h3>Estado</h3><span class="mono muted" style="font-size:13px">${p.progreso}% · entrega ${fecha(p.fecha_entrega)}</span></div>
          <div class="barra" style="margin:14px 0 4px"><i style="width:${p.progreso}%"></i></div>
          <div class="fases">${ORDEN_ESTADOS.map((e, i) => `<div class="fase ${i < idx ? 'hecha' : ''} ${i === idx ? 'actual' : ''}">${ESTADOS[e]}</div>`).join('')}</div>
          ${p.descripcion ? `<p class="muted" style="margin-top:16px;white-space:pre-wrap">${esc(p.descripcion)}</p>` : ''}
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center"><h3>Avances publicados</h3><button class="btn small solid" id="nAv">+ Publicar avance</button></div>
          ${avances?.length ? avances.map((a) => {
            const au = urlSegura(a.url);
            return `<div class="item"><div><p class="mono muted" style="font-size:11.5px">${fecha(a.created_at)}</p><p style="font-weight:600">${esc(a.titulo)}</p>
              ${a.descripcion ? `<p class="muted" style="white-space:pre-wrap">${esc(a.descripcion)}</p>` : ''}
              ${au ? `<a class="mono" style="font-size:13px" href="${esc(au)}" target="_blank" rel="noopener">Ver ↗</a>` : ''}</div>
              <button class="btn small ghost" data-del-av="${a.id}">Borrar</button></div>`;
          }).join('') : `<p class="muted" style="margin-top:10px">Publica el primer avance para que el cliente lo vea.</p>`}
        </div>
      </div>
      <div class="card">
        <h3>Conversación con el cliente</h3>
        <p class="muted" style="font-size:13.5px;margin:4px 0 16px">Lo que escribas aquí lo verá ${esc(p.clientes.nombre)}.</p>
        <div class="hilo" id="hilo">${comentarios?.length ? comentarios.map((c) => `
          <div class="msg ${c.autor_rol === 'creador' ? 'mio' : ''}"><p class="meta">${esc(c.autor_nombre)} · ${fecha(c.created_at, true)}</p><p>${esc(c.mensaje)}</p>${c.autor_rol === 'creador' ? '' : bloqueIA(c)}</div>`).join('')
          : `<p class="muted" style="font-size:13.5px">Sin mensajes todavía.</p>`}</div>
        <form id="fCom" style="margin-top:16px"><textarea id="txt" maxlength="4000" placeholder="Responder…" required></textarea>
          <button class="btn solid" style="margin-top:10px;width:100%">Enviar</button></form>
      </div>
    </div>`;
  const hilo = document.getElementById('hilo'); hilo.scrollTop = hilo.scrollHeight;

  // Al abrir el proyecto, se marcan sus mensajes como leídos
  if (comentarios?.some((c) => !c.leido)) { await sb.from('comentarios').update({ leido: true }).eq('proyecto_id', id).eq('leido', false); actualizarSinLeer(); }

  document.getElementById('copiar').onclick = async () => { await navigator.clipboard.writeText(enlacePortal); toast('Enlace copiado: ' + enlacePortal); };
  document.getElementById('edit').onclick = async () => abrirForm({ titulo: 'Editar proyecto', campos: await camposProyecto(), valores: p, guardar: guardarEn('proyectos', id) });
  document.getElementById('del').onclick = () => borrar('proyectos', id, 'este proyecto', '#cliente/' + p.clientes.id);
  document.getElementById('nAv').onclick = () => abrirForm({
    titulo: 'Publicar avance',
    campos: [{ k: 'titulo', label: 'Título', req: true, attrs: 'placeholder="Página de inicio terminada"' },
             { k: 'descripcion', label: 'Qué ha cambiado', tipo: 'textarea' },
             { k: 'url', label: 'Enlace (opcional)', tipo: 'url', attrs: 'placeholder="https://…"' }],
    guardar: async (d) => guardarEn('avances')({ ...d, proyecto_id: id }),
  });
  vista.querySelectorAll('[data-del-av]').forEach((b) => (b.onclick = () => borrar('avances', b.dataset.delAv, 'este avance')));
  vista.querySelectorAll('[data-analizar]').forEach((b) => (b.onclick = () => analizar(b.dataset.analizar, !!b.dataset.forzar, b)));
  vista.querySelectorAll('[data-usar]').forEach((b) => (b.onclick = () => {
    const a = iaDe(comentarios.find((x) => x.id === b.dataset.usar));
    const t = document.getElementById('txt');
    t.value = a?.respuesta || ''; t.focus(); t.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Respuesta copiada al cuadro. Revísala y pulsa Enviar.');
  }));
  document.getElementById('fCom').addEventListener('submit', async (e) => {
    e.preventDefault();
    const txt = document.getElementById('txt').value.trim(); if (!txt) return;
    e.target.querySelector('button').disabled = true;
    const { error } = await sb.from('comentarios').insert({ proyecto_id: id, mensaje: txt });
    if (fallo(error, 'No se pudo enviar')) { e.target.querySelector('button').disabled = false; return; }
    refrescar();
  });
}


  return { vProyectos, vProyecto };
}
