// Entrenamiento, preguntas y pruebas del asistente virtual.
export function crearAsistente({
  sb, vista, esc, fecha, chatAsistente,
  fallo, opts, abrirForm, guardarEn, borrar, refrescar,
}) {
// =================== ASISTENTE IA (entrenamiento) ===================
const AUDIENCIAS = { todos: 'Todos (web y clientes)', visitantes: 'Solo visitantes de la web', clientes: 'Solo clientes del portal' };
const CATS_KN = { general: 'General', estudio: 'Estudio', servicios: 'Servicios', portal: 'Portal', proceso: 'Proceso y plazos', precios: 'Precios y pagos', contenido: 'Contenido', contacto: 'Contacto', tecnico: 'Técnico' };
const camposKn = [
  { k: 'pregunta', label: 'Pregunta (como la haría un cliente)', req: true, attrs: 'maxlength="500" placeholder="¿Cuánto tarda en estar lista una web?"' },
  { k: 'respuesta', label: 'Respuesta que debe dar el asistente', tipo: 'textarea', req: true },
  { k: 'categoria', label: 'Categoría', tipo: 'select', opciones: opts(CATS_KN), def: 'general' },
  { k: 'audiencia', label: '¿Quién puede recibir esta respuesta?', tipo: 'select', opciones: opts(AUDIENCIAS), def: 'todos' },
  { k: 'activo', label: 'Estado', tipo: 'select', opciones: [{ v: 'true', l: 'Activa (el asistente la usa)' }, { v: 'false', l: 'Pausada' }], def: 'true' },
];
const guardarKn = (id) => async (d) => guardarEn('conocimiento', id)({ ...d, activo: d.activo !== 'false' });

async function actualizarAsis() {
  const { count } = await sb.from('asistente_preguntas').select('id', { count: 'exact', head: true }).eq('sabia', false).eq('estado', 'nueva');
  const el = document.getElementById('nAsis');
  el.textContent = count || ''; el.classList.toggle('oculto', !count);
}

async function vAsistente(sub = 'conocimiento') {
  const tabs = [['conocimiento', 'Conocimiento'], ['preguntas', 'Preguntas recibidas'], ['probar', 'Probar']];
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Asistente virtual</p><h1>Rodolfo</h1>
      <p class="muted" style="margin-top:6px;max-width:70ch">Responde a los visitantes de la web y a los clientes en su panel. Solo usa lo que le enseñéis aquí (y, con clientes, los datos de su proyecto). Si no sabe algo, lo dice: al visitante le invita a escribir por Contacto y al cliente le ofrece pasar la pregunta al equipo.</p></div></div>
    <nav class="subtabs">${tabs.map(([k, l]) => `<a href="#asistente/${k}" class="${k === sub ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div id="asisCont"></div>`;
  const cont = document.getElementById('asisCont');

  if (sub === 'probar') {
    const { data: proys } = await sb.from('proyectos').select('id, nombre, clientes(nombre)').order('created_at', { ascending: false });
    cont.innerHTML = `
      <div class="dos"><div>
        <div class="herr"><select id="pruebaProy"><option value="__web">Como visitante de la web</option><option value="">Como cliente sin proyecto</option>${(proys || []).map((p) => `<option value="${p.id}">${esc(p.nombre)} · ${esc(p.clientes?.nombre)}</option>`).join('')}</select></div>
        <div id="chatPrueba"></div></div>
        <div class="card"><h3>Cómo probarlo</h3><p class="muted" style="margin-top:8px">Escribe como si fueras un visitante o un cliente, en cualquier idioma. Elige «Como visitante de la web» para ver lo que responde en la página principal, o un proyecto para que responda con sus datos.</p>
          <p class="muted" style="margin-top:8px">Las pruebas no se guardan en «Preguntas de clientes». Si ves «⚠ No lo sabía», añade esa pregunta en <a href="#asistente/conocimiento">Conocimiento</a>.</p></div></div>`;
    const sel = () => document.getElementById('pruebaProy').value;
    chatAsistente({ destino: document.getElementById('chatPrueba'), proyecto: () => (sel() && sel() !== '__web' ? sel() : null), modo: () => (sel() === '__web' ? 'visitante' : null), prueba: true });
    return;
  }

  if (sub === 'preguntas') {
    const { data, error } = await sb.from('asistente_preguntas').select('*, perfiles(nombre, email), proyectos(nombre)').order('created_at', { ascending: false }).limit(200);
    if (fallo(error)) return;
    const sinSaber = data.filter((q) => !q.sabia && q.estado === 'nueva').length;
    const estadoTag = (q) => q.estado === 'ensenada' ? '<span class="tag ok">Enseñada</span>' : q.estado === 'enviada_equipo' ? '<span class="tag warn">Pasada al equipo</span>' : q.estado === 'revisada' ? '<span class="tag">Revisada</span>' : (q.sabia ? '<span class="tag">Respondida</span>' : '<span class="tag bad">No lo sabía</span>');
    cont.innerHTML = `
      <div class="herr"><select id="filtroQ"><option value="pend">Pendientes de enseñar (${sinSaber})</option><option value="todas">Todas</option></select></div>
      <div class="card" id="listaQ"></div>`;
    const pintar = () => {
      const f = document.getElementById('filtroQ').value;
      const lista = f === 'todas' ? data : data.filter((q) => !q.sabia && q.estado !== 'ensenada' && q.estado !== 'revisada');
      document.getElementById('listaQ').innerHTML = lista.length ? lista.map((q) => `
        <div class="kn"><div>
          <p class="mono muted" style="font-size:11.5px">${estadoTag(q)} ${q.origen === 'web' ? '<span class="tag dark">Web</span> Visitante anónimo' : esc(q.perfiles?.nombre || q.perfiles?.email || '—') + ' · ' + esc(q.proyectos?.nombre || 'sin proyecto')} · ${fecha(q.created_at, true)}${q.idioma ? ' · ' + esc(q.idioma) : ''}</p>
          <p style="font-weight:600;margin-top:6px">${esc(q.pregunta)}</p>
          <p class="r">↳ ${esc(q.respuesta || '—')}</p></div>
          <div class="acciones" style="align-content:flex-start">
            ${q.estado !== 'ensenada' ? `<button class="btn small solid" data-ensenar="${q.id}">Enseñar respuesta</button>` : ''}
            ${q.estado === 'nueva' && !q.sabia ? `<button class="btn small ghost" data-revisar="${q.id}">Ignorar</button>` : ''}
          </div></div>`).join('') : `<p class="muted">${f === 'todas' ? 'Aún nadie le ha preguntado nada.' : 'Nada pendiente: el asistente supo responder a todo.'}</p>`;
      cont.querySelectorAll('[data-ensenar]').forEach((b) => (b.onclick = () => {
        const q = data.find((x) => x.id === b.dataset.ensenar);
        abrirForm({ titulo: 'Enseñar a Rodolfo', campos: camposKn, valores: { pregunta: q.pregunta.slice(0, 500), categoria: 'general', activo: 'true', audiencia: q.origen === 'web' ? 'visitantes' : 'todos' },
          guardar: async (d) => {
            const r = await guardarKn()(d); if (r === false) return false;
            await sb.from('asistente_preguntas').update({ estado: 'ensenada' }).eq('id', q.id);
          } });
      }));
      cont.querySelectorAll('[data-revisar]').forEach((b) => (b.onclick = async () => {
        await sb.from('asistente_preguntas').update({ estado: 'revisada' }).eq('id', b.dataset.revisar); refrescar();
      }));
    };
    document.getElementById('filtroQ').onchange = pintar;
    pintar();
    return;
  }

  // Conocimiento
  const { data, error } = await sb.from('conocimiento').select('*').order('categoria').order('created_at');
  if (fallo(error)) return;
  cont.innerHTML = `
    <div class="herr" style="justify-content:space-between">
      <div style="display:flex;gap:10px;flex-wrap:wrap"><input id="buscarKn" type="search" placeholder="Buscar…">
        <select id="catKn"><option value="">Todas las categorías</option>${opts(CATS_KN).map((o) => `<option value="${o.v}">${o.l}</option>`).join('')}</select></div>
      <button class="btn solid" id="nKn">+ Enseñar algo nuevo</button></div>
    <p class="muted" style="margin-bottom:12px;font-size:13.5px">${data.filter((k) => k.activo).length} respuestas activas. Escribidlas en español: el asistente las traduce solo al idioma del cliente. Nunca pongáis aquí datos privados de un cliente.</p>
    <div class="card" id="listaKn"></div>`;
  const pintar = () => {
    const t = document.getElementById('buscarKn').value.toLowerCase(), c = document.getElementById('catKn').value;
    const lista = data.filter((k) => (!c || k.categoria === c) && (k.pregunta + ' ' + k.respuesta).toLowerCase().includes(t));
    document.getElementById('listaKn').innerHTML = lista.length ? lista.map((k) => `
      <div class="kn ${k.activo ? '' : 'inactivo'}"><div>
        <p class="mono muted" style="font-size:11.5px"><span class="tag">${esc(CATS_KN[k.categoria] || k.categoria)}</span> <span class="tag ${k.audiencia === 'todos' ? '' : 'dark'}">${esc(AUDIENCIAS[k.audiencia] || k.audiencia)}</span>${k.activo ? '' : ' <span class="tag warn">Pausada</span>'}</p>
        <p style="font-weight:600;margin-top:6px">${esc(k.pregunta)}</p><p class="r">${esc(k.respuesta)}</p></div>
        <div class="acciones" style="align-content:flex-start"><button class="btn small ghost" data-edit-kn="${k.id}">Editar</button><button class="btn small ghost" data-del-kn="${k.id}">Borrar</button></div></div>`).join('')
      : '<p class="muted">Sin resultados.</p>';
    cont.querySelectorAll('[data-edit-kn]').forEach((b) => (b.onclick = () => {
      const k = data.find((x) => x.id === b.dataset.editKn);
      abrirForm({ titulo: 'Editar respuesta', campos: camposKn, valores: { ...k, activo: String(k.activo) }, guardar: guardarKn(k.id) });
    }));
    cont.querySelectorAll('[data-del-kn]').forEach((b) => (b.onclick = () => borrar('conocimiento', b.dataset.delKn, 'esta respuesta')));
  };
  document.getElementById('buscarKn').oninput = pintar;
  document.getElementById('catKn').onchange = pintar;
  document.getElementById('nKn').onclick = () => abrirForm({ titulo: 'Enseñar algo nuevo', campos: camposKn, guardar: guardarKn() });
  pintar();
}


  return { vAsistente, actualizarAsis };
}
