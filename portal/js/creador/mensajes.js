// Bandeja de conversaciones con clientes y actualizaciones en tiempo real.
export function crearMensajes({
  sb, vista, esc, fecha, toast, perfil,
  fallo, iaDe, tagsIA, analizar, actualizarSinLeer,
}) {
// =================== MENSAJES · chat con cada cliente, en tiempo real ===================
let chatCliAbierto = null;     // cliente cuya conversación está abierta
async function vMensajes(clienteId) {
  // Si se recarga la conversación mientras escribes, no se pierde lo escrito
  const borrador = (clienteId && clienteId === chatCliAbierto) ? document.getElementById('ccTxt')?.value : '';
  chatCliAbierto = clienteId || null;
  const [{ data: msgs, error }, { data: clientes }, { data: proys }] = await Promise.all([
    sb.from('comentarios').select('*, proyectos(nombre), comentarios_ia(*)').order('created_at', { ascending: true }).limit(1000),
    sb.from('clientes').select('id, nombre, empresa, user_id').order('nombre'),
    sb.from('proyectos').select('id, nombre, cliente_id').order('created_at', { ascending: false }),
  ]);
  if (fallo(error)) return;
  // Conversaciones: clientes con mensajes (más recientes arriba) y luego el resto con cuenta
  const conv = (clientes || []).map((c) => {
    const m = msgs.filter((x) => x.cliente_id === c.id);
    const ult = m[m.length - 1];
    return { ...c, mensajes: m, ultimo: ult, sinLeer: m.filter((x) => !x.leido && x.autor_rol !== 'creador').length };
  }).filter((c) => c.mensajes.length || c.user_id)
    .sort((x, y) => (y.ultimo?.created_at || '').localeCompare(x.ultimo?.created_at || ''));
  const actual = conv.find((c) => c.id === chatCliAbierto) || null;

  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Bandeja</p><h1>Mensajes de clientes</h1></div></div>
    <div class="cc ${actual ? 'con-chat' : ''}">
      <nav class="cc-lista" aria-label="Conversaciones">${conv.length ? conv.map((c) => `
        <a href="#mensajes/${c.id}" class="${c.id === actual?.id ? 'on' : ''}">
          <span class="cc-fila"><b>${esc(c.nombre)}</b>${c.sinLeer ? `<span class="num">${c.sinLeer}</span>` : ''}</span>
          <small>${c.ultimo ? esc((c.ultimo.autor_rol === 'creador' ? 'Tú: ' : '') + c.ultimo.mensaje.slice(0, 60)) : 'Sin mensajes todavía'}</small>
          ${c.ultimo ? `<small class="mono" style="font-size:10.5px">${fecha(c.ultimo.created_at, true)}</small>` : ''}
        </a>`).join('') : '<p class="muted" style="padding:12px">Aún no hay clientes con cuenta.</p>'}</nav>
      <section class="card cc-chat">${actual ? `
        <div class="cc-cab">
          <a href="#mensajes" class="cc-volver mono">← Conversaciones</a>
          <div><h3>${esc(actual.nombre)}</h3><p class="muted" style="font-size:12.5px">${esc(actual.empresa || '')}${actual.empresa ? ' · ' : ''}<a href="#cliente/${actual.id}">Ficha del cliente →</a></p></div>
        </div>
        <div class="cc-hilo" id="ccHilo">${actual.mensajes.length ? actual.mensajes.map(burbujaCC).join('') : '<p class="muted" style="margin:auto;text-align:center;font-size:13.5px">Todavía no os habéis escrito.<br>Puedes empezar tú la conversación.</p>'}</div>
        ${sugerenciaIA(actual.mensajes)}
        <form id="ccForm" class="cc-form">
          <select id="ccProy" aria-label="Proyecto">${(proys || []).filter((p) => p.cliente_id === actual.id).map((p) => `<option value="${p.id}">Sobre: ${esc(p.nombre)}</option>`).join('')}<option value="">Sobre: general</option></select>
          <div class="cc-escribir"><textarea id="ccTxt" rows="2" maxlength="4000" placeholder="Responde a ${esc(actual.nombre.split(' ')[0])}…" title="Intro para enviar · Mayús+Intro para nueva línea" required></textarea>
          <button class="btn solid" type="submit">Enviar</button></div>
        </form>` : '<div class="vacio" style="border:0;margin:auto">Elige una conversación para leerla y responder.</div>'}</section>
    </div>`;

  if (!actual) return;
  const hilo = document.getElementById('ccHilo'); hilo.scrollTop = hilo.scrollHeight;
  if (matchMedia('(max-width:900px)').matches) { const alto = document.querySelector('header.top')?.offsetHeight || 0; window.scrollTo(0, document.querySelector('.cc-chat').getBoundingClientRect().top + scrollY - alto - 8); }
  // Proyecto por defecto: el del último mensaje del cliente
  const ultCli = [...actual.mensajes].reverse().find((m) => m.autor_rol !== 'creador');
  const selP = document.getElementById('ccProy');
  if (ultCli && [...selP.options].some((o) => o.value === (ultCli.proyecto_id || ''))) selP.value = ultCli.proyecto_id || '';
  const txt = document.getElementById('ccTxt');
  if (borrador) txt.value = borrador;
  txt.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); document.getElementById('ccForm').requestSubmit(); } });
  document.getElementById('ccForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensaje = txt.value.trim(); if (!mensaje) return;
    const b = e.target.querySelector('button'); b.disabled = true;
    const proyecto_id = document.getElementById('ccProy').value || null;
    const { data, error } = await sb.from('comentarios').insert({ mensaje, proyecto_id, cliente_id: actual.id }).select('*, proyectos(nombre), comentarios_ia(*)').single();
    b.disabled = false;
    if (fallo(error, 'No se ha enviado')) return;
    txt.value = ''; txt.focus();
    document.querySelector('.cc-ia')?.remove();
    anadirCC(data);
  });
  vista.querySelectorAll('[data-usar-cc]').forEach((b) => (b.onclick = () => {
    const m = actual.mensajes.find((x) => x.id === b.dataset.usarCc);
    txt.value = iaDe(m)?.respuesta || ''; txt.focus();
    toast('Respuesta copiada al cuadro. Revísala y pulsa Enviar.');
  }));
  vista.querySelectorAll('[data-analizar]').forEach((b) => (b.onclick = () => analizar(b.dataset.analizar, !!b.dataset.forzar, b)));
  if (actual.sinLeer) { await sb.from('comentarios').update({ leido: true }).eq('cliente_id', actual.id).eq('leido', false); actualizarSinLeer(); }
}

const burbujaCC = (m) => `<div class="eq-msg ${m.autor_rol === 'creador' ? 'mio' : ''}" data-id="${m.id}">
  <p class="meta">${esc(m.autor_rol === 'creador' ? (m.autor_id === perfil.id ? 'Tú' : (m.autor_nombre || 'A2WD')) : (m.autor_nombre || 'Cliente'))} · ${fecha(m.created_at, true)}${m.proyectos?.nombre ? ` · <span class="tag" style="font-size:10px">${esc(m.proyectos.nombre)}</span>` : ''}${m.autor_rol !== 'creador' ? tagsIA(iaDe(m)) : ''}</p>
  <p>${esc(m.mensaje)}</p></div>`;

// Sugerencia del asistente para el último mensaje del cliente que aún no tiene respuesta
function sugerenciaIA(lista) {
  const ult = lista[lista.length - 1];
  if (!ult || ult.autor_rol === 'creador') return '';
  const a = iaDe(ult);
  if (!a) return `<div class="cc-ia"><button class="btn small ghost" data-analizar="${ult.id}">✦ Pedir borrador de respuesta a la IA</button></div>`;
  return `<div class="cc-ia">
    <p class="mono muted" style="font-size:11px;margin-bottom:4px">✦ ASISTENTE · ${esc(a.resumen)}</p>
    ${a.necesita_info ? `<p class="aviso" style="font-size:12.5px">⚠ ${esc(a.necesita_info)}</p>` : ''}
    ${a.respuesta ? `<p class="sug" style="font-size:13px">${esc(a.respuesta)}</p><button class="btn small solid" data-usar-cc="${ult.id}" style="margin-top:6px">Usar respuesta</button>` : ''}
  </div>`;
}

function anadirCC(m) {
  const hilo = document.getElementById('ccHilo');
  if (!hilo || hilo.querySelector(`[data-id="${m.id}"]`)) return;
  if (!hilo.querySelector('.eq-msg')) hilo.innerHTML = '';
  hilo.insertAdjacentHTML('beforeend', burbujaCC(m));
  hilo.scrollTop = hilo.scrollHeight;
}

// Tiempo real: mensajes nuevos de clientes
sb.channel('chat-creador')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios' }, async ({ new: m }) => {
    const abierta = location.hash.startsWith('#mensajes') && chatCliAbierto === m.cliente_id;
    if (m.autor_rol !== 'creador') {
      if (abierta) { vMensajes(chatCliAbierto); }                      // recarga la conversación (con análisis IA)
      else if (location.hash.startsWith('#mensajes')) vMensajes(chatCliAbierto);
      else toast(`💬 ${m.autor_nombre || 'Cliente'}: ${m.mensaje.slice(0, 60)}`);
      actualizarSinLeer();
    } else if (abierta && m.autor_id !== perfil.id) {
      const { data } = await sb.from('comentarios').select('*, proyectos(nombre), comentarios_ia(*)').eq('id', m.id).single();
      if (data) anadirCC(data);
    }
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios_ia' }, () => {
    if (location.hash.startsWith('#mensajes/') && chatCliAbierto) vMensajes(chatCliAbierto);   // llega el borrador de la IA
  })
  .subscribe();


  return { vMensajes };
}
