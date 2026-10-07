// Entrenamiento, preguntas y pruebas del asistente virtual.
export function crearAsistente({
  sb, vista, esc, fecha, chatAsistente,
  fallo, opts, abrirForm, guardarEn, borrar, refrescar,
}) {
// =================== ASISTENTE IA (entrenamiento) ===================
const AUDIENCIAS = { todos: 'Todos (web y clientes)', visitantes: 'Solo visitantes de la web', clientes: 'Solo clientes del portal' };
const IDIOMAS = { es: 'Español', fr: 'Français', en: 'English', it: 'Italiano' };
const idiomaDe = (x) => (IDIOMAS[String(x || '').slice(0, 2)] ? String(x).slice(0, 2) : 'es');
const CATS_KN = { general: 'General', estudio: 'Estudio', servicios: 'Servicios', portal: 'Portal', proceso: 'Proceso y plazos', precios: 'Precios y pagos', contenido: 'Contenido', contacto: 'Contacto', tecnico: 'Técnico' };
const camposKn = [
  { k: 'idioma', label: 'Idioma de esta pregunta y su respuesta', tipo: 'select', opciones: opts(IDIOMAS), def: 'es' },
  { k: 'pregunta', label: 'Pregunta (como la haría un cliente)', req: true, attrs: 'maxlength="500" placeholder="¿Cuánto tarda en estar lista una web?"' },
  { k: 'respuesta', label: 'Respuesta que debe dar el asistente', tipo: 'textarea', req: true },
  { k: 'categoria', label: 'Categoría', tipo: 'select', opciones: opts(CATS_KN), def: 'general' },
  { k: 'audiencia', label: '¿Quién puede recibir esta respuesta?', tipo: 'select', opciones: opts(AUDIENCIAS), def: 'todos' },
  { k: 'activo', label: 'Estado', tipo: 'select', opciones: [{ v: 'true', l: 'Activa (el asistente la usa)' }, { v: 'false', l: 'Pausada' }], def: 'true' },
];
// extra: campos que no salen en el formulario (traduccion_de al crear una traducción)
const guardarKn = (id, extra = {}) => async (d) => guardarEn('conocimiento', id)({ ...d, ...extra, activo: d.activo !== 'false' });

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
      <div class="herr"><select id="filtroQ"><option value="pend">Pendientes de enseñar (${sinSaber})</option><option value="todas">Todas</option></select>
        <select id="idiomaQ"><option value="">Todos los idiomas</option>${opts(IDIOMAS).map((o) => `<option value="${o.v}">${o.l} (${data.filter((q) => idiomaDe(q.idioma) === o.v).length})</option>`).join('')}</select></div>
      <div class="card" id="listaQ"></div>`;
    const pintar = () => {
      const f = document.getElementById('filtroQ').value, li = document.getElementById('idiomaQ').value;
      const lista = (f === 'todas' ? data : data.filter((q) => !q.sabia && q.estado !== 'ensenada' && q.estado !== 'revisada'))
        .filter((q) => !li || idiomaDe(q.idioma) === li);
      document.getElementById('listaQ').innerHTML = lista.length ? lista.map((q) => `
        <div class="kn"><div>
          <p class="mono muted" style="font-size:11.5px">${estadoTag(q)} ${q.origen === 'web' ? '<span class="tag dark">Web</span> Visitante anónimo' : esc(q.perfiles?.nombre || q.perfiles?.email || '—') + ' · ' + esc(q.proyectos?.nombre || 'sin proyecto')} · ${fecha(q.created_at, true)}${q.idioma ? ` <span class="tag">${esc(idiomaDe(q.idioma).toUpperCase())}</span>` : ''}</p>
          <p style="font-weight:600;margin-top:6px">${esc(q.pregunta)}</p>
          <p class="r">↳ ${esc(q.respuesta || '—')}</p></div>
          <div class="acciones" style="align-content:flex-start">
            ${q.estado !== 'ensenada' ? `<button class="btn small solid" data-ensenar="${q.id}">Enseñar respuesta</button>` : ''}
            ${q.estado === 'nueva' && !q.sabia ? `<button class="btn small ghost" data-revisar="${q.id}">Ignorar</button>` : ''}
          </div></div>`).join('') : `<p class="muted">${f === 'todas' ? 'Aún nadie le ha preguntado nada.' : 'Nada pendiente: el asistente supo responder a todo.'}</p>`;
      cont.querySelectorAll('[data-ensenar]').forEach((b) => (b.onclick = () => {
        const q = data.find((x) => x.id === b.dataset.ensenar);
        abrirForm({ titulo: 'Enseñar a Rodolfo', campos: camposKn, valores: { idioma: idiomaDe(q.idioma), pregunta: q.pregunta.slice(0, 500), categoria: 'general', activo: 'true', audiencia: q.origen === 'web' ? 'visitantes' : 'todos' },
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
    document.getElementById('idiomaQ').onchange = pintar;
    pintar();
    return;
  }

  // Conocimiento: cada respuesta original con sus traducciones debajo
  const { data, error } = await sb.from('conocimiento').select('*').order('categoria').order('created_at');
  if (fallo(error)) return;
  const originales = data.filter((k) => !k.traduccion_de);
  const traducciones = (id) => data.filter((k) => k.traduccion_de === id);
  const faltan = (k) => Object.keys(IDIOMAS).filter((l) => l !== idiomaDe(k.idioma) && !traducciones(k.id).some((t) => idiomaDe(t.idioma) === l));
  // Una traducción hereda categoría y público de su original: el formulario solo pide idioma, textos y estado
  const camposTrad = (l) => [
    { k: 'idioma', label: 'Idioma', tipo: 'select', opciones: [{ v: l, l: IDIOMAS[l] }], def: l },
    { ...camposKn.find((c) => c.k === 'pregunta'), label: `Pregunta en ${IDIOMAS[l]} (tradúcela)` },
    { ...camposKn.find((c) => c.k === 'respuesta'), label: `Respuesta en ${IDIOMAS[l]} (tradúcela)` },
    camposKn.find((c) => c.k === 'activo'),
  ];
  // Al cambiar categoría o público de una original, sus traducciones la siguen
  const guardarOriginal = (id) => async (d) => {
    const r = await guardarKn(id)(d); if (r === false) return false;
    if (id) await sb.from('conocimiento').update({ categoria: d.categoria, audiencia: d.audiencia }).eq('traduccion_de', id);
  };
  cont.innerHTML = `
    <div class="herr" style="justify-content:space-between">
      <div style="display:flex;gap:10px;flex-wrap:wrap"><input id="buscarKn" type="search" placeholder="Buscar…">
        <select id="catKn"><option value="">Todas las categorías</option>${opts(CATS_KN).map((o) => `<option value="${o.v}">${o.l}</option>`).join('')}</select>
        <select id="idiomaKn"><option value="">Todos los idiomas</option>${opts(IDIOMAS).map((o) => `<option value="${o.v}">${o.l} (${data.filter((k) => idiomaDe(k.idioma) === o.v).length})</option>`).join('')}</select></div>
      <button class="btn solid" id="nKn">+ Enseñar algo nuevo</button></div>
    <p class="muted" style="margin-bottom:12px;font-size:13.5px">${data.filter((k) => k.activo).length} respuestas activas. Podéis escribirlas en español, francés, inglés o italiano: si una respuesta existe en el idioma de quien pregunta, Rodolfo usa esa; si no, traduce la que haya. Con «+ FR», «+ EN»… añadís la traducción de una respuesta. Nunca pongáis aquí datos privados de un cliente.</p>
    <div class="card" id="listaKn"></div>`;
  const fila = (k, esTrad) => `
      <div class="kn ${k.activo ? '' : 'inactivo'}"${esTrad ? ' style="margin-left:28px;padding-left:16px;border-left:2px solid var(--line)"' : ''}><div>
        <p class="mono muted" style="font-size:11.5px"><span class="tag dark">${esc(idiomaDe(k.idioma).toUpperCase())}</span> ${esTrad ? '<span class="tag">Traducción</span>' : `<span class="tag">${esc(CATS_KN[k.categoria] || k.categoria)}</span> <span class="tag ${k.audiencia === 'todos' ? '' : 'dark'}">${esc(AUDIENCIAS[k.audiencia] || k.audiencia)}</span>`}${k.activo ? '' : ' <span class="tag warn">Pausada</span>'}</p>
        <p style="font-weight:600;margin-top:6px">${esc(k.pregunta)}</p><p class="r">${esc(k.respuesta)}</p></div>
        <div class="acciones" style="align-content:flex-start">${esTrad ? '' : faltan(k).map((l) => `<button class="btn small ghost" data-trad-kn="${k.id}" data-idioma="${l}" title="Añadir la versión en ${IDIOMAS[l]}">+ ${l.toUpperCase()}</button>`).join('')}<button class="btn small ghost" data-edit-kn="${k.id}">Editar</button><button class="btn small ghost" data-del-kn="${k.id}">Borrar</button></div></div>`;
  const pintar = () => {
    const t = document.getElementById('buscarKn').value.toLowerCase(), c = document.getElementById('catKn').value, li = document.getElementById('idiomaKn').value;
    const coincide = (k) => (k.pregunta + ' ' + k.respuesta).toLowerCase().includes(t);
    let html;
    if (li) {
      // Un idioma elegido: lista plana con solo las respuestas en ese idioma
      const lista = data.filter((k) => idiomaDe(k.idioma) === li && (!c || k.categoria === c) && coincide(k));
      html = lista.map((k) => fila(k, !!k.traduccion_de)).join('');
    } else {
      const lista = originales.filter((k) => (!c || k.categoria === c) && (coincide(k) || traducciones(k.id).some(coincide)));
      html = lista.map((k) => fila(k, false) + traducciones(k.id).map((x) => fila(x, true)).join('')).join('');
    }
    document.getElementById('listaKn').innerHTML = html || '<p class="muted">Sin resultados.</p>';
    cont.querySelectorAll('[data-edit-kn]').forEach((b) => (b.onclick = () => {
      const k = data.find((x) => x.id === b.dataset.editKn);
      const valores = { ...k, idioma: idiomaDe(k.idioma), activo: String(k.activo) };
      if (k.traduccion_de) abrirForm({ titulo: `Editar traducción (${IDIOMAS[idiomaDe(k.idioma)]})`, campos: camposTrad(idiomaDe(k.idioma)), valores, guardar: guardarKn(k.id) });
      else abrirForm({ titulo: 'Editar respuesta', campos: camposKn, valores, guardar: guardarOriginal(k.id) });
    }));
    cont.querySelectorAll('[data-trad-kn]').forEach((b) => (b.onclick = () => {
      const k = data.find((x) => x.id === b.dataset.tradKn), l = b.dataset.idioma;
      abrirForm({ titulo: `Traducir al ${IDIOMAS[l]}`, campos: camposTrad(l),
        valores: { idioma: l, pregunta: k.pregunta, respuesta: k.respuesta, activo: 'true' },
        guardar: guardarKn(null, { traduccion_de: k.id, categoria: k.categoria, audiencia: k.audiencia }) });
    }));
    cont.querySelectorAll('[data-del-kn]').forEach((b) => (b.onclick = () => {
      const k = data.find((x) => x.id === b.dataset.delKn);
      borrar('conocimiento', k.id, !k.traduccion_de && traducciones(k.id).length ? 'esta respuesta y sus traducciones' : 'esta respuesta');
    }));
  };
  document.getElementById('buscarKn').oninput = pintar;
  document.getElementById('catKn').onchange = pintar;
  document.getElementById('idiomaKn').onchange = pintar;
  document.getElementById('nKn').onclick = () => abrirForm({ titulo: 'Enseñar algo nuevo', campos: camposKn, guardar: guardarKn() });
  pintar();
}


  return { vAsistente, actualizarAsis };
}
