import { avatar, cuando } from '../chat.js';

const IDIOMAS = { es: 'Español', fr: 'Francés', it: 'Italiano', en: 'Inglés' };
const RESPUESTA = { es: 'Hola', fr: 'Bonjour', it: 'Ciao', en: 'Hello' };
const MAX_MENSAJES = 500;

export function crearBuzon({ sb, vista, esc, toast, fallo, borrar }) {
  const estado = { mensajes: [], abierto: null };

  const fechaLarga = (iso) => { const t = new Date(iso).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const parrafos = (t) => esc(t).replace(/\n/g, '<br>');
  const respuesta = (m) => {
    const asunto = `Re: ${m.asunto || 'Tu mensaje a A2WD'}`;
    const cuerpo = `${RESPUESTA[m.idioma] || RESPUESTA.es} ${m.nombre.split(/\s+/)[0]},\n\n\n\n> ${m.mensaje.split('\n').join('\n> ')}`;
    return `mailto:${m.email.replace(/[?&#%]/g, encodeURIComponent)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  };

  async function cargar() {
    const { data, error } = await sb.from('mensajes_web').select('*').order('created_at', { ascending: false }).limit(MAX_MENSAJES);
    if (fallo(error)) return false;
    estado.mensajes = data;
    return true;
  }

  async function actualizarBuzon() {
    const { count } = await sb.from('mensajes_web').select('id', { count: 'exact', head: true }).eq('leido', false).eq('archivado', false);
    const el = document.getElementById('nBuzon');
    if (!el) return;
    el.textContent = count || '';
    el.classList.toggle('oculto', !count);
  }

  async function cambiar(m, cambios, aviso) {
    const { error } = await sb.from('mensajes_web').update(cambios).eq('id', m.id);
    if (fallo(error, 'No se ha podido guardar')) return false;
    Object.assign(m, cambios);
    if (aviso) toast(aviso);
    actualizarBuzon();
    return true;
  }

  function htmlLista(lista) {
    if (!lista.length) return '<p class="muted bandeja-nada">No hay mensajes.</p>';
    return lista.map((m) => `
      <a href="#buzon/${esc(m.id)}" class="conv${m.id === estado.abierto ? ' on' : ''}${m.leido ? '' : ' sin-leer'}"
         data-buscar="${esc(`${m.nombre} ${m.email} ${m.asunto} ${m.mensaje}`.toLowerCase())}">
        ${avatar(m.nombre, m.email)}
        <span class="conv-txt">
          <span class="conv-fila"><b>${esc(m.nombre)}</b><time>${esc(cuando(m.created_at))}</time></span>
          <span class="conv-fila"><small>${esc((m.asunto || m.mensaje).slice(0, 80))}</small>${m.leido ? '' : '<span class="num" aria-label="Sin leer">1</span>'}</span>
        </span>
      </a>`).join('');
  }

  function htmlCorreo(m) {
    if (m.correo_enviado_en) return '<span class="tag ok">Aviso enviado a info@</span>';
    if (m.correo_error === 'Falta RESEND_API_KEY') return '<span class="tag">Aviso por correo sin configurar</span>';
    if (m.correo_error) return `<span class="tag bad" title="${esc(m.correo_error)}">El aviso por correo falló</span>`;
    return '';
  }

  function htmlDetalle(m) {
    return `
      <header class="bandeja-cab">
        <a href="#buzon${m.archivado ? '/archivo' : ''}" class="bandeja-volver" aria-label="Volver a los mensajes">←</a>
        ${avatar(m.nombre, m.email)}
        <div class="bandeja-quien">
          <h3>${esc(m.nombre)}</h3>
          <p><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></p>
        </div>
      </header>
      <div class="buzon-cuerpo">
        <p class="buzon-meta">${esc(fechaLarga(m.created_at))} · ${esc(IDIOMAS[m.idioma] || m.idioma)}${['', '/', '/index.html'].includes(m.pagina) ? '' : ` · ${esc(m.pagina)}`} ${htmlCorreo(m)}</p>
        <h2 class="buzon-asunto">${esc(m.asunto || 'Sin asunto')}</h2>
        <p class="buzon-texto">${parrafos(m.mensaje)}</p>
      </div>
      <footer class="buzon-acciones">
        <a class="btn solid" href="${esc(respuesta(m))}"><span class="i i-enviar" aria-hidden="true"></span>Responder</a>
        <button class="btn ghost" type="button" id="bzLeido">${m.leido ? 'Marcar como no leído' : 'Marcar como leído'}</button>
        <button class="btn ghost" type="button" id="bzArchivar">${m.archivado ? 'Devolver a la bandeja' : 'Archivar'}</button>
        <button class="btn danger" type="button" id="bzBorrar">Borrar</button>
      </footer>`;
  }

  function filtrar(texto) {
    const q = texto.trim().toLowerCase();
    document.querySelectorAll('#bzLista .conv').forEach((a) => { a.hidden = !!q && !a.dataset.buscar.includes(q); });
  }

  function conectarDetalle(m) {
    document.getElementById('bzLeido').addEventListener('click', async () => {
      if (await cambiar(m, { leido: !m.leido }, m.leido ? 'Marcado como no leído' : 'Marcado como leído')) location.hash = `buzon${m.archivado ? '/archivo' : ''}`;
    });
    document.getElementById('bzArchivar').addEventListener('click', async () => {
      const vuelve = m.archivado;
      if (await cambiar(m, { archivado: !m.archivado, leido: true }, vuelve ? 'De vuelta en la bandeja' : 'Archivado')) location.hash = `buzon${vuelve ? '/archivo' : ''}`;
    });
    document.getElementById('bzBorrar').addEventListener('click', () => {
      borrar('mensajes_web', m.id, `el mensaje de ${m.nombre}`, `buzon${m.archivado ? '/archivo' : ''}`);
    });
  }

  async function vBuzon(id) {
    if (!await cargar()) return;
    const abierto = estado.mensajes.find((m) => m.id === id) || null;
    estado.abierto = abierto?.id || null;
    const archivo = id === 'archivo' || !!abierto?.archivado;
    const lista = estado.mensajes.filter((m) => m.archivado === archivo);
    const vacio = lista.length ? 'Elige un mensaje para leerlo.' : archivo ? 'No hay mensajes archivados.' : 'Todavía no ha llegado ningún mensaje desde el formulario de la web.';

    vista.innerHTML = `
      <div class="cabecera">
        <div><p class="eyebrow">Formulario de la web</p><h1>${archivo ? 'Mensajes archivados' : 'Mensajes web'}</h1></div>
        <a class="btn ghost" href="#buzon${archivo ? '' : '/archivo'}">${archivo ? '← Bandeja' : 'Archivados'}</a>
      </div>
      <div class="bandeja ${abierto ? 'con-chat' : ''}">
        <aside class="bandeja-lista">
          <label class="bandeja-buscar"><span class="i i-buscar" aria-hidden="true"></span>
            <input type="search" id="bzBuscar" placeholder="Buscar nombre, correo o texto" aria-label="Buscar mensaje"></label>
          <nav class="bandeja-convs" id="bzLista" aria-label="Mensajes">${htmlLista(lista)}</nav>
        </aside>
        <section class="card bandeja-chat buzon">${abierto ? htmlDetalle(abierto) : `<p class="bandeja-vacia">${vacio}</p>`}</section>
      </div>`;

    document.getElementById('bzBuscar').addEventListener('input', (e) => filtrar(e.target.value));
    if (!abierto) return;
    conectarDetalle(abierto);
    if (!abierto.leido && await cambiar(abierto, { leido: true })) {
      document.querySelector(`#bzLista a[href="#buzon/${abierto.id}"]`)?.classList.remove('sin-leer');
      document.querySelector(`#bzLista a[href="#buzon/${abierto.id}"] .num`)?.remove();
      document.getElementById('bzLeido').textContent = 'Marcar como no leído';
    }
  }

  sb.channel('buzon-web')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_web' }, ({ new: m }) => {
      toast(`✉️ ${m.nombre}: ${(m.asunto || m.mensaje).slice(0, 60)}`);
      actualizarBuzon();
      if (location.hash.startsWith('#buzon') && !location.hash.startsWith('#buzon/archivo') && !estado.abierto) vBuzon();
    })
    .subscribe();

  return { vBuzon, actualizarBuzon };
}
