// =====================================================================
//  MENSAJES · bandeja de conversaciones con clientes, en tiempo real
//  - Izquierda: conversaciones (buscador, avatar, último mensaje, sin leer).
//  - Derecha: hilo agrupado por día y autor (js/chat.js), borrador de la IA
//    y caja para responder.
//  Los datos se cargan una vez al entrar; lo que llega en tiempo real se
//  añade al estado y solo se repinta la parte que cambia.
// =====================================================================
import { pintarHilo, repintar, alFondo, prepararEscritura, pistaTeclado, avatar, cuando } from '../chat.js';

const CAMPOS = '*, proyectos(nombre), comentarios_ia(*)';
const MAX_MENSAJES = 1000;

export function crearMensajes({ sb, vista, esc, toast, perfil, fallo, iaDe, tagsIA, analizar, actualizarSinLeer }) {
  const estado = { mensajes: [], clientes: [], proyectos: [], abierto: null, primerNuevo: null };
  let escritura = null;      // caja de escribir de la conversación abierta

  // ---------- Datos ----------
  async function cargar() {
    const [m, c, p] = await Promise.all([
      sb.from('comentarios').select(CAMPOS).order('created_at', { ascending: true }).limit(MAX_MENSAJES),
      sb.from('clientes').select('id, nombre, empresa, user_id').order('nombre'),
      sb.from('proyectos').select('id, nombre, cliente_id').order('created_at', { ascending: false }),
    ]);
    if (fallo(m.error || c.error || p.error)) return false;
    estado.mensajes = m.data;
    estado.clientes = c.data;
    estado.proyectos = p.data;
    return true;
  }

  const esDelCliente = (m) => m.autor_rol !== 'creador';
  const mensajesDe = (clienteId) => estado.mensajes.filter((m) => m.cliente_id === clienteId);

  // Clientes con mensajes (el más reciente arriba) y después los que tienen cuenta pero no han escrito
  function conversaciones() {
    return estado.clientes
      .map((c) => {
        const mensajes = mensajesDe(c.id);
        return { ...c, ultimo: mensajes.at(-1), sinLeer: mensajes.filter((m) => !m.leido && esDelCliente(m)).length };
      })
      .filter((c) => c.ultimo || c.user_id)
      .sort((a, b) => (b.ultimo?.created_at || '').localeCompare(a.ultimo?.created_at || ''));
  }

  // ---------- Vista ----------
  async function vMensajes(clienteId) {
    const borrador = clienteId && clienteId === estado.abierto ? escritura?.txt.value : '';
    estado.abierto = clienteId || null;
    if (!await cargar()) return;

    const actual = estado.clientes.find((c) => c.id === estado.abierto) || null;
    estado.primerNuevo = actual ? mensajesDe(actual.id).find((m) => !m.leido && esDelCliente(m))?.id ?? null : null;

    vista.innerHTML = `
      <div class="cabecera"><div><p class="eyebrow">Bandeja</p><h1>Mensajes de clientes</h1></div></div>
      <div class="bandeja ${actual ? 'con-chat' : ''}">
        <aside class="bandeja-lista">
          <label class="bandeja-buscar"><span class="i i-buscar" aria-hidden="true"></span>
            <input type="search" id="ccBuscar" placeholder="Buscar cliente o empresa" aria-label="Buscar conversación"></label>
          <nav class="bandeja-convs" id="ccConvs" aria-label="Conversaciones">${htmlLista()}</nav>
        </aside>
        <section class="card bandeja-chat">${actual ? htmlChat(actual) : '<p class="bandeja-vacia">Elige una conversación para leerla y responder.</p>'}</section>
      </div>`;

    document.getElementById('ccBuscar').addEventListener('input', (e) => filtrarLista(e.target.value));
    if (!actual) return;

    conectarChat(actual, borrador);
    if (estado.primerNuevo) await marcarLeidos(actual.id);
  }

  function htmlLista() {
    const lista = conversaciones();
    if (!lista.length) return '<p class="muted bandeja-nada">Aún no hay clientes con cuenta.</p>';
    return lista.map((c) => {
      const previa = c.ultimo ? (esDelCliente(c.ultimo) ? '' : 'Tú: ') + c.ultimo.mensaje : 'Sin mensajes todavía';
      return `
        <a href="#mensajes/${esc(c.id)}" class="conv${c.id === estado.abierto ? ' on' : ''}${c.sinLeer ? ' sin-leer' : ''}"
           data-buscar="${esc(`${c.nombre} ${c.empresa || ''}`.toLowerCase())}">
          ${avatar(c.nombre, c.id)}
          <span class="conv-txt">
            <span class="conv-fila"><b>${esc(c.nombre)}</b><time>${esc(cuando(c.ultimo?.created_at))}</time></span>
            <span class="conv-fila"><small>${esc(previa.slice(0, 80))}</small>${c.sinLeer ? `<span class="num" aria-label="${c.sinLeer} sin leer">${c.sinLeer}</span>` : ''}</span>
          </span>
        </a>`;
    }).join('');
  }

  // Repinta la lista respetando lo que haya en el buscador
  function pintarLista() {
    const convs = document.getElementById('ccConvs');
    if (!convs) return;
    convs.innerHTML = htmlLista();
    filtrarLista(document.getElementById('ccBuscar').value);
  }

  function filtrarLista(texto) {
    const q = texto.trim().toLowerCase();
    document.querySelectorAll('#ccConvs .conv').forEach((a) => { a.hidden = !!q && !a.dataset.buscar.includes(q); });
  }

  function htmlChat(c) {
    const proyectos = estado.proyectos.filter((p) => p.cliente_id === c.id);
    return `
      <header class="bandeja-cab">
        <a href="#mensajes" class="bandeja-volver" aria-label="Volver a las conversaciones">←</a>
        ${avatar(c.nombre, c.id)}
        <div class="bandeja-quien">
          <h3>${esc(c.nombre)}</h3>
          <p>${c.empresa ? `${esc(c.empresa)} · ` : ''}<a href="#cliente/${esc(c.id)}">Ficha del cliente →</a></p>
        </div>
      </header>
      <div class="chat-hilo" id="ccHilo" aria-live="polite">${htmlHilo(c.id)}</div>
      <div id="ccIA">${htmlSugerencia(c.id)}</div>
      <form class="chat-escribir" id="ccForm">
        ${proyectos.length ? `
          <select id="ccProy" class="bandeja-tema" aria-label="Proyecto del mensaje">
            ${proyectos.map((p) => `<option value="${esc(p.id)}">Sobre: ${esc(p.nombre)}</option>`).join('')}
            <option value="">Sobre: general</option>
          </select>` : ''}
        <div class="chat-caja">
          <textarea id="ccTxt" rows="1" maxlength="4000" placeholder="Responde a ${esc((c.nombre || '').split(' ')[0])}…" aria-label="Mensaje"></textarea>
          <button class="chat-enviar" type="submit" aria-label="Enviar"><span class="i i-enviar" aria-hidden="true"></span></button>
        </div>
        ${pistaTeclado()}
      </form>`;
  }

  const htmlHilo = (clienteId) => pintarHilo(mensajesDe(clienteId), {
    esMio: (m) => !esDelCliente(m),                                   // todo lo de A2WD a la derecha
    autor: (m) => esDelCliente(m) ? (m.autor_nombre || 'Cliente') : (m.autor_id === perfil.id ? '' : (m.autor_nombre || 'A2WD')),
    tema: (m) => m.proyectos?.nombre || '',
    extra: (m) => esDelCliente(m) ? tagsIA(iaDe(m)) : '',
    primerNuevo: estado.primerNuevo,
    textos: { hoy: 'Hoy', ayer: 'Ayer', nuevos: 'Nuevos', vacio: 'Todavía no os habéis escrito. Puedes empezar tú la conversación.' },
  });

  // Borrador de la IA para el último mensaje del cliente, si aún no tiene respuesta
  function htmlSugerencia(clienteId) {
    const ultimo = mensajesDe(clienteId).at(-1);
    if (!ultimo || !esDelCliente(ultimo)) return '';
    const ia = iaDe(ultimo);
    if (!ia) return `<div class="bandeja-ia"><button class="btn small ghost" data-analizar="${esc(ultimo.id)}">✦ Pedir borrador de respuesta a la IA</button></div>`;
    return `
      <div class="bandeja-ia">
        <p class="bandeja-ia-cab">✦ Asistente · ${esc(ia.resumen)}</p>
        ${ia.necesita_info ? `<p class="aviso">⚠ ${esc(ia.necesita_info)}</p>` : ''}
        ${ia.respuesta ? `<p class="sug">${esc(ia.respuesta)}</p>
          <button class="btn small solid" data-usar-ia="${esc(ultimo.id)}">Usar respuesta</button>` : ''}
      </div>`;
  }

  // ---------- Comportamiento ----------
  function conectarChat(c, borrador) {
    const hilo = document.getElementById('ccHilo');
    const form = document.getElementById('ccForm');
    const selProy = document.getElementById('ccProy');

    // Proyecto por defecto: el del último mensaje del cliente
    const ultimoCli = mensajesDe(c.id).findLast(esDelCliente);
    if (selProy && ultimoCli && [...selProy.options].some((o) => o.value === (ultimoCli.proyecto_id || ''))) {
      selProy.value = ultimoCli.proyecto_id || '';
    }

    escritura = prepararEscritura(form, {
      alEnviar: async (mensaje) => {
        const { data, error } = await sb.from('comentarios')
          .insert({ mensaje, cliente_id: c.id, proyecto_id: selProy?.value || null })
          .select(CAMPOS).single();
        if (fallo(error, 'No se ha enviado')) return false;
        anadir(data, { forzarFondo: true });
        return true;
      },
    });
    if (borrador) escritura.poner(borrador);

    alFondo(hilo);
    // En el móvil, que el chat ocupe la pantalla al abrirlo
    if (matchMedia('(max-width:900px)').matches) {
      const alto = document.querySelector('header.top')?.offsetHeight || 0;
      scrollTo(0, document.querySelector('.bandeja-chat').getBoundingClientRect().top + scrollY - alto - 8);
    }

    // Botones de la IA (el bloque se repinta, así que se escucha en el contenedor)
    document.getElementById('ccIA').addEventListener('click', (e) => {
      const usar = e.target.closest('[data-usar-ia]');
      const pedir = e.target.closest('[data-analizar]');
      if (usar) {
        const m = estado.mensajes.find((x) => x.id === usar.dataset.usarIa);
        escritura.poner(iaDe(m)?.respuesta || '');
        toast('Respuesta copiada al cuadro. Revísala y pulsa Enviar.');
      }
      if (pedir) analizar(pedir.dataset.analizar, !!pedir.dataset.forzar, pedir);
    });
  }

  async function marcarLeidos(clienteId) {
    await sb.from('comentarios').update({ leido: true }).eq('cliente_id', clienteId).eq('leido', false);
    estado.mensajes.forEach((m) => { if (m.cliente_id === clienteId) m.leido = true; });
    pintarLista();
    actualizarSinLeer();
  }

  // Añade un mensaje al estado y repinta solo lo necesario
  function anadir(m, { forzarFondo = false } = {}) {
    if (estado.mensajes.some((x) => x.id === m.id)) return;
    estado.mensajes.push(m);
    if (!location.hash.startsWith('#mensajes')) return;
    pintarLista();
    if (m.cliente_id !== estado.abierto) return;
    repintar(document.getElementById('ccHilo'), htmlHilo(m.cliente_id), { forzarFondo });
    document.getElementById('ccIA').innerHTML = htmlSugerencia(m.cliente_id);
  }

  // ---------- Tiempo real ----------
  sb.channel('chat-creador')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios' }, async ({ new: nuevo }) => {
      if (estado.mensajes.some((x) => x.id === nuevo.id)) return;           // lo acabamos de enviar nosotros
      const { data: m } = await sb.from('comentarios').select(CAMPOS).eq('id', nuevo.id).single();
      if (!m) return;
      const enBandeja = location.hash.startsWith('#mensajes');
      if (enBandeja) anadir(m);
      else if (esDelCliente(m)) toast(`💬 ${m.autor_nombre || 'Cliente'}: ${m.mensaje.slice(0, 60)}`);
      if (esDelCliente(m) && enBandeja && m.cliente_id === estado.abierto) await marcarLeidos(m.cliente_id);
      else actualizarSinLeer();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios_ia' }, ({ new: ia }) => {
      const m = estado.mensajes.find((x) => x.id === ia.comentario_id);       // llega el borrador de la IA
      if (!m) return;
      m.comentarios_ia = [ia];
      if (location.hash.startsWith('#mensajes/') && m.cliente_id === estado.abierto) {
        repintar(document.getElementById('ccHilo'), htmlHilo(m.cliente_id));
        document.getElementById('ccIA').innerHTML = htmlSugerencia(m.cliente_id);
      }
    })
    .subscribe();

  return { vMensajes };
}
