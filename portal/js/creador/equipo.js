// Chat interno entre creadores y notificaciones en tiempo real.
export function crearEquipo({ sb, vista, esc, perfil, fallo, toast, ESTADOS }) {
// =================== EQUIPO · chat interno solo para creadores ===================
// Canal «General» + un canal por proyecto. Mensajes en tiempo real y aviso en el móvil.
let equipoCanal = null;           // null = General; o id de proyecto
let equipoVisible = false;        // ¿está abierta la vista del chat?
const enlazar = (t) => esc(t).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
const diaDe = (d) => { const t = new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
const horaDe = (d) => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

async function actualizarEquipo() {
  const { data: l } = await sb.from('equipo_lecturas').select('visto_en').eq('usuario_id', perfil.id).maybeSingle();
  let q = sb.from('equipo_mensajes').select('id', { count: 'exact', head: true }).neq('autor_id', perfil.id);
  if (l?.visto_en) q = q.gt('created_at', l.visto_en);
  const { count } = await q;
  const el = document.getElementById('nEquipo');
  const n = equipoVisible ? 0 : (count || 0);
  el.textContent = n || ''; el.classList.toggle('oculto', !n);
}
const marcarEquipoLeido = () => sb.from('equipo_lecturas').upsert({ usuario_id: perfil.id, visto_en: new Date().toISOString() });

function burbuja(m) {
  const mio = m.autor_id === perfil.id;
  return `<div class="eq-msg ${mio ? 'mio' : ''}" data-id="${m.id}">
    <p class="meta">${esc(mio ? 'Tú' : (m.autor_nombre || 'Equipo'))} · ${horaDe(m.created_at)}${mio ? ` <button class="eq-borrar" data-borrar="${m.id}" title="Borrar mensaje" aria-label="Borrar mensaje">×</button>` : ''}</p>
    <p>${enlazar(m.mensaje)}</p></div>`;
}
function pintarHilo(lista) {
  let dia = '', html = '';
  for (const m of lista) {
    const d = diaDe(m.created_at);
    if (d !== dia) { dia = d; html += `<p class="eq-dia">${esc(d)}</p>`; }
    html += burbuja(m);
  }
  return html || '<p class="muted" style="margin:auto;text-align:center;font-size:13.5px">Aún no hay mensajes en este canal.<br>Escribe el primero.</p>';
}

async function vEquipo(canalId) {
  equipoCanal = canalId || null;
  const [{ data: proyectos }, { data: mensajes }] = await Promise.all([
    sb.from('proyectos').select('id, nombre, estado').order('created_at', { ascending: false }),
    (() => { let q = sb.from('equipo_mensajes').select('*').order('created_at', { ascending: true }).limit(300);
             return equipoCanal ? q.eq('proyecto_id', equipoCanal) : q.is('proyecto_id', null); })(),
  ]);
  const canales = [{ id: '', nombre: 'General', sub: 'Organización, ideas y avisos' }, ...(proyectos || []).map((p) => ({ id: p.id, nombre: p.nombre, sub: ESTADOS[p.estado] || '' }))];
  const actual = canales.find((c) => c.id === (equipoCanal || '')) || canales[0];
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Solo creadores</p><h1>Comunicación de equipo</h1></div></div>
    <div class="eq">
      <nav class="eq-canales" aria-label="Canales">
        <select id="eqSel" class="eq-sel" aria-label="Canal">${canales.map((c) => `<option value="${c.id}" ${c.id === actual.id ? 'selected' : ''}>${c.id ? '# ' : ''}${esc(c.nombre)}</option>`).join('')}</select>
        ${canales.map((c) => `<a href="#equipo${c.id ? '/' + c.id : ''}" class="${c.id === actual.id ? 'on' : ''}"><b>${c.id ? '# ' : ''}${esc(c.nombre)}</b><small>${esc(c.sub)}</small></a>`).join('')}
      </nav>
      <section class="card eq-chat">
        <div class="eq-cab"><div><h3>${actual.id ? '# ' : ''}${esc(actual.nombre)}</h3><p class="muted" style="font-size:12.5px">${actual.id ? `<a href="#proyecto/${actual.id}">Abrir ficha del proyecto →</a>` : 'Canal común del equipo'}</p></div></div>
        <div class="eq-hilo" id="eqHilo">${pintarHilo(mensajes || [])}</div>
        <form id="eqForm" class="eq-form">
          <textarea id="eqTxt" rows="2" maxlength="4000" placeholder="Escribe a tu socio…" title="Intro para enviar · Mayús+Intro para nueva línea" required></textarea>
          <button class="btn solid" type="submit">Enviar</button>
        </form>
      </section>
    </div>`;
  equipoVisible = true;
  const hilo = document.getElementById('eqHilo');
  hilo.scrollTop = hilo.scrollHeight;
  if (matchMedia('(max-width:900px)').matches) { const sel = document.getElementById('eqSel'); const alto = document.querySelector('header.top')?.offsetHeight || 0; window.scrollTo(0, sel.getBoundingClientRect().top + scrollY - alto - 8); }
  document.getElementById('eqSel').onchange = (e) => { location.hash = 'equipo' + (e.target.value ? '/' + e.target.value : ''); };
  const txt = document.getElementById('eqTxt');
  txt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); document.getElementById('eqForm').requestSubmit(); }
  });
  document.getElementById('eqForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensaje = txt.value.trim(); if (!mensaje) return;
    const b = e.target.querySelector('button'); b.disabled = true;
    const { data, error } = await sb.from('equipo_mensajes').insert({ mensaje, proyecto_id: equipoCanal }).select('*').single();
    b.disabled = false;
    if (fallo(error, 'No se ha enviado')) return;
    txt.value = ''; txt.focus();
    anadirMensaje(data);
  });
  hilo.addEventListener('click', async (e) => {
    const id = e.target.dataset?.borrar; if (!id) return;
    if (!confirm('¿Borrar este mensaje para los dos?')) return;
    const { error } = await sb.from('equipo_mensajes').delete().eq('id', id);
    if (!fallo(error, 'No se ha borrado')) hilo.querySelector(`[data-id="${id}"]`)?.remove();
  });
  await marcarEquipoLeido();
  actualizarEquipo();
}

function anadirMensaje(m) {
  const hilo = document.getElementById('eqHilo');
  if (!hilo || hilo.querySelector(`[data-id="${m.id}"]`)) return;
  if (!hilo.querySelector('.eq-msg')) hilo.innerHTML = '';
  const ultimoDia = [...hilo.querySelectorAll('.eq-dia')].pop()?.textContent;
  const d = diaDe(m.created_at);
  if (d !== ultimoDia) hilo.insertAdjacentHTML('beforeend', `<p class="eq-dia">${esc(d)}</p>`);
  hilo.insertAdjacentHTML('beforeend', burbuja(m));
  hilo.scrollTop = hilo.scrollHeight;
}

// Tiempo real: mensajes nuevos del socio sin recargar
sb.channel('equipo')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'equipo_mensajes' }, async ({ new: m }) => {
    const enEsteCanal = equipoVisible && (m.proyecto_id || null) === equipoCanal && location.hash.startsWith('#equipo');
    if (enEsteCanal) { anadirMensaje(m); if (!document.hidden) await marcarEquipoLeido(); }
    else if (m.autor_id !== perfil.id) toast(`👥 ${m.autor_nombre || 'Equipo'}: ${m.mensaje.slice(0, 60)}`);
    actualizarEquipo();
  })
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'equipo_mensajes' }, ({ old }) => {
    document.querySelector(`#eqHilo [data-id="${old.id}"]`)?.remove();
  })
  .subscribe();
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#equipo')) equipoVisible = false; });


  return { vEquipo, actualizarEquipo };
}
