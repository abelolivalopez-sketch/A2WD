// Cabecera del panel: perfil, bandeja (campana) y buscador global (Ctrl K / ⌘ K).
export function crearBarra({ sb, esc, euros, perfil, ESTADOS }) {
  const $ = (id) => document.getElementById(id);

  // ---------- Perfil ----------
  const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
  function pintarPerfil(nombre) {
    $('quien').textContent = nombre;
    $('avatar').textContent = iniciales(nombre);
  }
  pintarPerfil(perfil.nombre || perfil.email);

  // ---------- Bandeja ----------
  const boton = $('bBandeja');
  const pop = $('pBandeja');
  const abrirPop = (abrir) => {
    pop.hidden = !abrir;
    boton.setAttribute('aria-expanded', String(abrir));
  };
  boton.addEventListener('click', (e) => { e.stopPropagation(); abrirPop(pop.hidden); });
  document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target)) abrirPop(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { abrirPop(false); boton.focus(); } });
  pop.querySelectorAll('[data-cerrar-pop]').forEach((a) => a.addEventListener('click', () => abrirPop(false)));

  // Las cifras salen de los contadores del menú lateral, que ya se actualizan solos
  const fuentes = [
    { badge: 'nSinLeer', n: 'bMsj', txt: 'bMsjTxt', si: (n) => n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`, no: 'Al día' },
    { badge: 'nEquipo', n: 'bEq', txt: 'bEqTxt', si: (n) => n === 1 ? '1 mensaje nuevo de tu socio' : `${n} mensajes nuevos`, no: 'Al día' },
    { badge: 'nAsis', n: 'bAsis', txt: 'bAsisTxt', si: (n) => n === 1 ? '1 pregunta que no supo responder' : `${n} preguntas que no supo responder`, no: 'Sabe responder todo lo que le preguntan' },
  ];
  function contarBandeja() {
    let total = 0;
    for (const f of fuentes) {
      const n = Number($(f.badge).textContent) || 0;
      total += n;
      $(f.n).textContent = n || '';
      $(f.txt).textContent = n ? f.si(n) : f.no;
      $(f.n).closest('.pop-fila').classList.toggle('hay', n > 0);
    }
    const c = $('nBandeja');
    c.textContent = total > 99 ? '99+' : total || '';
    c.classList.toggle('oculto', !total);
    boton.setAttribute('aria-label', total ? `Bandeja de entrada: ${total} pendientes` : 'Bandeja de entrada: al día');
    $('bandejaResumen').textContent = total ? `${total} pendiente${total === 1 ? '' : 's'}` : 'Todo al día';
  }
  const obs = new MutationObserver(contarBandeja);
  fuentes.forEach((f) => obs.observe($(f.badge), { childList: true, characterData: true, subtree: true }));
  contarBandeja();

  // ---------- Buscador ----------
  const dlg = $('paleta');
  const q = $('paletaQ');
  const res = $('paletaRes');
  const esMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $('atajo').textContent = esMac ? '⌘ K' : 'Ctrl K';
  $('abrirBuscar').setAttribute('aria-label', `Buscar (${esMac ? '⌘ K' : 'Ctrl K'})`);

  const SECCIONES = [
    ['Resumen', '#resumen', 'resumen'], ['Clientes', '#clientes', 'clientes'], ['Proyectos', '#proyectos', 'proyectos'],
    ['Facturas y presupuestos', '#facturas', 'facturas'], ['Mensajes de clientes', '#mensajes', 'mensajes'],
    ['Chat de equipo', '#equipo', 'equipo'], ['Rodolfo IA', '#asistente', 'asistente'], ['Web (portafolio)', '#web', 'web'],
    ['Tarifas', '#tarifas', 'tarifas'], ['Ajustes', '#ajustes', 'ajustes'],
  ];
  const ESTADO_FAC = { borrador: 'Borrador', pendiente: 'Pendiente', pagada: 'Pagada', vencida: 'Vencida', anulada: 'Anulada' };
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let datos = null, ops = [], activo = 0;

  async function cargar() {
    const [c, p, f] = await Promise.all([
      sb.from('clientes').select('id,nombre,empresa,email,estado').order('nombre'),
      sb.from('proyectos').select('id,nombre,estado, clientes(nombre,empresa)').order('created_at', { ascending: false }),
      sb.from('facturas').select('id,tipo,numero,concepto,total,estado,cliente_id, clientes(nombre,empresa)').order('fecha_emision', { ascending: false }),
    ]);
    datos = { clientes: c.data || [], proyectos: p.data || [], facturas: f.data || [] };
  }

  // Resalta lo que coincide (sin tener en cuenta tildes ni mayúsculas)
  function resaltar(texto, consulta) {
    const t = String(texto || '');
    if (!consulta) return esc(t);
    const i = norm(t).indexOf(consulta);
    if (i < 0) return esc(t);
    return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + consulta.length)) + '</mark>' + esc(t.slice(i + consulta.length));
  }
  const puntuar = (consulta, ...campos) => {
    let mejor = 0;
    for (const c of campos) {
      const n = norm(c);
      if (!n) continue;
      if (n.startsWith(consulta)) mejor = Math.max(mejor, 3);
      else if (n.split(/\s+/).some((p) => p.startsWith(consulta))) mejor = Math.max(mejor, 2);
      else if (n.includes(consulta)) mejor = Math.max(mejor, 1);
    }
    return mejor;
  };

  function pintar() {
    const consulta = norm(q.value.trim());
    const grupos = [];
    if (consulta && datos) {
      const top = (lista) => lista.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5);
      const cli = top(datos.clientes.map((c) => ({ s: puntuar(consulta, c.nombre, c.empresa, c.email), ir: '#cliente/' + c.id, ico: 'clientes',
        t: resaltar(c.nombre, consulta), sub: resaltar([c.empresa, c.email].filter(Boolean).join(' · '), consulta), meta: c.estado === 'activo' ? '' : esc(c.estado) })));
      const pro = top(datos.proyectos.map((p) => ({ s: puntuar(consulta, p.nombre, p.clientes?.nombre, p.clientes?.empresa), ir: '#proyecto/' + p.id, ico: 'proyectos',
        t: resaltar(p.nombre, consulta), sub: resaltar(p.clientes?.empresa || p.clientes?.nombre || '', consulta), meta: esc(ESTADOS[p.estado] || p.estado) })));
      const fac = top(datos.facturas.map((f) => ({ s: puntuar(consulta, f.numero, f.concepto, f.clientes?.nombre, f.clientes?.empresa), ir: '#cliente/' + f.cliente_id, ico: 'facturas',
        t: resaltar(`${f.tipo === 'presupuesto' ? 'Presupuesto' : 'Factura'} ${f.numero || ''}`.trim(), consulta) + ' · ' + resaltar(f.concepto, consulta),
        sub: resaltar(f.clientes?.empresa || f.clientes?.nombre || '', consulta), meta: `${euros(f.total)} · ${esc(ESTADO_FAC[f.estado] || f.estado)}` })));
      if (cli.length) grupos.push(['Clientes', cli]);
      if (pro.length) grupos.push(['Proyectos', pro]);
      if (fac.length) grupos.push(['Facturas y presupuestos', fac]);
    }
    const secs = SECCIONES.filter(([n]) => !consulta || norm(n).includes(consulta))
      .map(([n, ir, ico]) => ({ ir, ico, t: resaltar(n, consulta), sub: '', meta: '' }));
    if (secs.length) grupos.push([consulta ? 'Ir a' : 'Ir a una sección', secs]);

    ops = grupos.flatMap(([, l]) => l);
    activo = Math.min(activo, Math.max(0, ops.length - 1));
    if (!ops.length) {
      res.innerHTML = `<p class="paleta-vacio">No hay nada que coincida con «${esc(q.value.trim())}».<br>Prueba con el nombre del negocio, el correo o el número de factura.</p>`;
      return;
    }
    let k = 0;
    res.innerHTML = grupos.map(([g, l]) => `<p class="paleta-grupo">${g}</p>` + l.map((o) => {
      const i = k++;
      return `<button type="button" class="paleta-op ${i === activo ? 'act' : ''}" role="option" aria-selected="${i === activo}" data-i="${i}">
        <span class="i i-${o.ico}" aria-hidden="true"></span><span><b>${o.t}</b>${o.sub ? `<small>${o.sub}</small>` : ''}</span>${o.meta ? `<span class="meta">${o.meta}</span>` : ''}</button>`;
    }).join('')).join('');
  }
  function mover(d) {
    if (!ops.length) return;
    activo = (activo + d + ops.length) % ops.length;
    res.querySelectorAll('.paleta-op').forEach((b) => {
      const on = Number(b.dataset.i) === activo;
      b.classList.toggle('act', on); b.setAttribute('aria-selected', String(on));
      if (on) b.scrollIntoView({ block: 'nearest' });
    });
  }
  function ir(i) {
    const o = ops[i]; if (!o) return;
    dlg.close();
    if (location.hash === o.ir) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash = o.ir;
  }
  async function abrir() {
    if (dlg.open) return;
    q.value = ''; activo = 0;
    dlg.showModal();
    q.focus();
    pintar();
    await cargar();
    pintar();
  }
  $('abrirBuscar').addEventListener('click', abrir);
  q.addEventListener('input', () => { activo = 0; pintar(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); ir(activo); }
  });
  res.addEventListener('click', (e) => { const b = e.target.closest('.paleta-op'); if (b) ir(Number(b.dataset.i)); });
  res.addEventListener('mousemove', (e) => {
    const b = e.target.closest('.paleta-op');
    if (b && Number(b.dataset.i) !== activo) { activo = Number(b.dataset.i); res.querySelectorAll('.paleta-op').forEach((x) => x.classList.toggle('act', x === b)); }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });      // clic fuera del cuadro
  document.addEventListener('keydown', (e) => {
    const escribiendo = e.target.closest?.('input,textarea,select,[contenteditable]');
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dlg.open ? dlg.close() : abrir(); }
    else if (e.key === '/' && !escribiendo && !dlg.open && !document.querySelector('dialog[open]')) { e.preventDefault(); abrir(); }
  });

  // Marca el botón de Ajustes cuando se está en esa pantalla
  const marcarAjustes = () => document.querySelectorAll('.cab [data-s="ajustes"]').forEach((a) => a.classList.toggle('on', location.hash.startsWith('#ajustes')));
  window.addEventListener('hashchange', marcarAjustes);
  marcarAjustes();

  return { pintarPerfil };
}
