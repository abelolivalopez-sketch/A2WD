// =====================================================================
//  RESUMEN · el estado del negocio de un vistazo
//  - Ingresos: lo facturado este mes y los últimos 12 meses.
//  - Dinero pendiente: por cobrar (y vencido), presupuestos enviados e IVA del trimestre.
//  - Requiere atención: lo que hay que hacer hoy (cobros, entregas, clientes esperando…).
//  - Cartera de clientes y producción (proyectos en marcha por fase y entregas).
//  Todo se calcula aquí con los datos de Supabase; no hay tablas nuevas.
// =====================================================================
export function crearResumen({ sb, vista, perfil, esc, euros, ESTADOS, iaDe }) {
const DIA = 864e5;
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FASES = ['diseno', 'desarrollo', 'revision'];

// Fechas: las de tipo «2026-10-05» se leen en hora local para no cambiar de día
const aFecha = (s) => (s ? new Date(String(s).length === 10 ? s + 'T00:00:00' : s) : null);
const inicioDia = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const diasHasta = (s) => Math.round((inicioDia(aFecha(s)) - inicioDia()) / DIA);
const claveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fechaCorta = (s) => { const d = aFecha(s); return `${d.getDate()} ${MES[d.getMonth()]}`; };
const enDias = (n) => (n === 0 ? 'hoy' : n === 1 ? 'mañana' : n > 1 ? `en ${n} días` : n === -1 ? 'ayer' : `hace ${-n} días`);
const haceDias = (n) => (n <= 0 ? 'hoy' : n === 1 ? 'desde ayer' : `desde hace ${n} días`);
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const eur = (n) => Number(n || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
const eurEje = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} mil €` : `${Math.round(n)} €`);
const nombreCli = (c) => (c ? c.empresa || c.nombre : 'Cliente');

const ICO = { bad: 'alerta', warn: 'reloj', info: 'flecha', ok: 'ok' };

async function vResumen() {
  const ahora = new Date();
  const [cli, pro, fac, com, ava, asis] = await Promise.all([
    sb.from('clientes').select('id,nombre,empresa,estado,created_at'),
    sb.from('proyectos').select('id,nombre,estado,progreso,fecha_entrega,created_at,cliente_id, clientes(nombre,empresa)'),
    sb.from('facturas').select('id,tipo,numero,concepto,base,total,estado,fecha_emision,fecha_vencimiento,cliente_id, clientes(nombre,empresa)'),
    sb.from('comentarios').select('id,cliente_id,autor_rol,autor_nombre,mensaje,created_at, comentarios_ia(prioridad,resumen)').order('created_at', { ascending: false }).limit(600),
    sb.from('avances').select('proyecto_id,created_at').order('created_at', { ascending: false }).limit(600),
    sb.from('asistente_preguntas').select('id', { count: 'exact', head: true }).eq('sabia', false).eq('estado', 'nueva'),
  ]);
  const error = [cli, pro, fac, com, ava].find((r) => r.error)?.error;
  if (error) {
    vista.innerHTML = `<div class="vacio">No se ha podido cargar el resumen (${esc(error.message)}). Comprueba la conexión y recarga la página.</div>`;
    return;
  }
  const clientes = cli.data || [], proyectos = pro.data || [], facturas = fac.data || [];
  const comentarios = com.data || [], avances = ava.data || [];
  const clientePorId = Object.fromEntries(clientes.map((c) => [c.id, c]));

  // ---------- Ingresos ----------
  const emitidas = facturas.filter((f) => f.tipo === 'factura' && !['borrador', 'anulada'].includes(f.estado));
  const porMes = {};
  for (const f of emitidas) { const k = f.fecha_emision.slice(0, 7); (porMes[k] ||= { base: 0, n: 0 }); porMes[k].base += Number(f.base); porMes[k].n++; }
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const k = claveMes(d);
    meses.push({ k, d, base: porMes[k]?.base || 0, n: porMes[k]?.n || 0, actual: i === 0 });
  }
  const esteMes = meses[11];
  const anterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const hastaHoyAnterior = emitidas
    .filter((f) => f.fecha_emision.slice(0, 7) === claveMes(anterior) && Number(f.fecha_emision.slice(8, 10)) <= ahora.getDate())
    .reduce((s, f) => s + Number(f.base), 0);
  const total12 = meses.reduce((s, m) => s + m.base, 0);
  const n12 = meses.reduce((s, m) => s + m.n, 0);

  // ---------- Dinero pendiente ----------
  const hoyTxt = claveMes(ahora) + '-' + String(ahora.getDate()).padStart(2, '0');
  const porCobrar = facturas.filter((f) => f.tipo === 'factura' && ['pendiente', 'vencida'].includes(f.estado));
  const vencidas = porCobrar.filter((f) => f.estado === 'vencida' || (f.fecha_vencimiento && f.fecha_vencimiento < hoyTxt));
  const sumaCobrar = porCobrar.reduce((s, f) => s + Number(f.total), 0);
  const sumaVencido = vencidas.reduce((s, f) => s + Number(f.total), 0);
  const presupuestos = facturas.filter((f) => f.tipo === 'presupuesto' && f.estado === 'pendiente');
  const sumaPresu = presupuestos.reduce((s, f) => s + Number(f.base), 0);
  const presuViejo = presupuestos.reduce((m, f) => Math.max(m, -diasHasta(f.fecha_emision)), 0);

  // IVA: si estamos en plazo de presentar el trimestre anterior, se enseña ese; si no, el que está en curso
  const tri = Math.floor(ahora.getMonth() / 3);                   // 0..3
  const enPlazo = (ahora.getMonth() % 3 === 0 && ahora.getDate() <= 20) || (ahora.getMonth() === 0 && ahora.getDate() <= 30);
  const triIva = enPlazo ? (tri + 3) % 4 : tri;
  const anioIva = enPlazo && tri === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear();
  const ivaDe = emitidas.filter((f) => { const d = aFecha(f.fecha_emision); return d.getFullYear() === anioIva && Math.floor(d.getMonth() / 3) === triIva; });
  const iva = ivaDe.reduce((s, f) => s + (Number(f.total) - Number(f.base)), 0);
  const limite303 = triIva === 3 ? `30 de enero` : `20 de ${MES_L[(triIva + 1) * 3]}`;
  const ivaTexto = enPlazo
    ? `Modelo 303 del ${triIva + 1}T: presentar antes del ${limite303}.`
    : `Lo que lleváis este trimestre. Se presenta antes del ${limite303}.`;

  // ---------- Requiere atención ----------
  const tareas = [];
  for (const f of vencidas) {
    const d = f.fecha_vencimiento ? -diasHasta(f.fecha_vencimiento) : 0;
    tareas.push({ g: 'bad', orden: 0, t: `Factura ${f.numero || ''} vencida ${d > 0 ? `hace ${plural(d, 'día', 'días')}` : ''}`.trim(),
      s: `${nombreCli(f.clientes)} · ${eur(f.total)} sin cobrar`, ir: '#cliente/' + f.cliente_id });
  }
  const activos = proyectos.filter((p) => p.estado !== 'entregado');
  for (const p of activos) {
    if (!p.fecha_entrega) continue;
    const d = diasHasta(p.fecha_entrega);
    const sub = `${nombreCli(p.clientes)} · ${ESTADOS[p.estado] || p.estado} · ${p.progreso} %`;
    if (d < 0) tareas.push({ g: 'bad', orden: 1, t: `${p.nombre}: la entrega era ${enDias(d)}`, s: sub, ir: '#proyecto/' + p.id });
    else if (d <= 7) tareas.push({ g: 'warn', orden: 3, t: `${p.nombre} se entrega ${enDias(d)}`, s: sub, ir: '#proyecto/' + p.id });
  }
  // Clientes que esperan respuesta: el último mensaje de su conversación es suyo
  const porCliente = {};
  for (const c of comentarios) (porCliente[c.cliente_id] ||= []).push(c);            // ya vienen del más nuevo al más viejo
  for (const [cid, lista] of Object.entries(porCliente)) {
    if (lista[0]?.autor_rol !== 'cliente') continue;
    let desde = lista[0];
    for (const m of lista) { if (m.autor_rol !== 'cliente') break; desde = m; }
    const ia = iaDe(lista[0]) || lista.map(iaDe).find(Boolean);
    const dias = -diasHasta(desde.created_at);
    const quien = clientePorId[cid]?.nombre || desde.autor_nombre || 'Un cliente';
    const sev = ia?.prioridad === 'urgente' ? 'bad' : (ia?.prioridad === 'alta' || dias >= 2) ? 'warn' : 'info';
    const texto = ia?.resumen || lista[0].mensaje;
    tareas.push({ g: sev, orden: 2, t: `${quien} espera respuesta ${haceDias(dias)}`,
      s: texto.length > 110 ? texto.slice(0, 110) + '…' : texto, ir: '#mensajes/' + cid, prioridad: ia?.prioridad });
  }
  for (const f of porCobrar) {
    if (vencidas.includes(f) || !f.fecha_vencimiento) continue;
    const d = diasHasta(f.fecha_vencimiento);
    if (d <= 7) tareas.push({ g: 'warn', orden: 4, t: `Factura ${f.numero || ''} vence ${enDias(d)}`, s: `${nombreCli(f.clientes)} · ${eur(f.total)}`, ir: '#cliente/' + f.cliente_id });
  }
  // Proyectos sin avances publicados en más de 14 días: el cliente no ve novedades
  const ultimoAvance = {};
  for (const a of avances) if (!ultimoAvance[a.proyecto_id]) ultimoAvance[a.proyecto_id] = a.created_at;
  for (const p of activos) {
    const ref = ultimoAvance[p.id] || p.created_at;
    const d = -diasHasta(ref);
    if (d > 14) tareas.push({ g: 'info', orden: 5, t: `${p.nombre} lleva ${d} días sin avances publicados`,
      s: `${nombreCli(p.clientes)} no ve novedades desde el ${fechaCorta(ref)}`, ir: '#proyecto/' + p.id });
  }
  for (const f of presupuestos) {
    const d = -diasHasta(f.fecha_emision);
    if (d > 14) tareas.push({ g: 'info', orden: 6, t: `Presupuesto ${f.numero || ''} sin respuesta desde hace ${d} días`.replace('  ', ' '),
      s: `${nombreCli(f.clientes)} · ${eur(f.base)} · buen momento para llamar`, ir: '#cliente/' + f.cliente_id });
  }
  if (asis.count) tareas.push({ g: 'info', orden: 7, t: `Rodolfo no supo responder ${plural(asis.count, 'pregunta', 'preguntas')}`,
    s: 'Enséñale la respuesta y la sabrá la próxima vez', ir: '#asistente/preguntas' });
  const peso = { bad: 0, warn: 1, info: 2 };
  tareas.sort((a, b) => peso[a.g] - peso[b.g] || a.orden - b.orden);
  const urgentes = tareas.filter((x) => x.g === 'bad').length;
  const pendientes = tareas.length - urgentes;

  // ---------- Cartera ----------
  const est = { activo: 0, potencial: 0, pausado: 0, antiguo: 0 };
  for (const c of clientes) est[c.estado] = (est[c.estado] || 0) + 1;
  const nuevosMes = clientes.filter((c) => claveMes(aFecha(c.created_at)) === claveMes(ahora)).length;
  const conProyecto = new Set(activos.map((p) => p.cliente_id));
  const sinProyecto = clientes.filter((c) => c.estado === 'activo' && !conProyecto.has(c.id));

  // ---------- Producción ----------
  const porFase = Object.fromEntries(FASES.map((f) => [f, activos.filter((p) => p.estado === f).length]));
  const entregados = proyectos.length - activos.length;
  const cola = [...activos].sort((a, b) => (a.fecha_entrega || '9999') .localeCompare(b.fecha_entrega || '9999'));

  // ---------- Pintar ----------
  const nombre = String(perfil.nombre || '').trim().split(/\s+/)[0] || '';
  const h = ahora.getHours();
  const saludo = h >= 6 && h < 14 ? 'Buenos días' : h >= 14 && h < 21 ? 'Buenas tardes' : 'Buenas noches';
  const fechaLarga = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const frase = !tareas.length ? 'Todo al día: no hay nada urgente ni pendiente.'
    : urgentes ? `Hoy tienes <b>${plural(urgentes, 'cosa urgente', 'cosas urgentes')}</b>${pendientes ? ` y ${plural(pendientes, 'pendiente', 'pendientes')}` : ''}.`
    : `Hoy tienes <b>${plural(pendientes, 'cosa pendiente', 'cosas pendientes')}</b>, nada urgente.`;

  vista.innerHTML = `
    <header class="res-cab">
      <p class="eyebrow">${esc(fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1))}</p>
      <h1>${saludo}${nombre ? ', ' + esc(nombre) : ''}</h1>
      <p class="res-frase">${frase}</p>
    </header>
    <div class="res-grid">
      ${tarjetaIngresos()}
      ${tarjetaDinero()}
      ${tarjetaAtencion()}
      ${tarjetaCartera()}
      ${tarjetaProduccion()}
    </div>`;
  activarGrafico();

  function tarjetaIngresos() {
    const max = Math.max(...meses.map((m) => m.base));
    const tope = escalaBonita(max);
    const delta = hastaHoyAnterior > 0 ? Math.round(((esteMes.base - hastaHoyAnterior) / hastaHoyAnterior) * 100) : null;
    const comp = `A estas alturas de ${MES_L[anterior.getMonth()]}: ${eur(hastaHoyAnterior)}`;
    const chip = delta === null ? '' : `<span class="delta ${delta >= 0 ? 'sube' : 'baja'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} %</span>`;
    const lineas = total12 ? [tope, tope / 2].map((v) => `<div class="g-linea" style="bottom:${(v / tope) * 100}%"><span>${eurEje(v)}</span></div>`).join('') : '';
    const cols = meses.map((m, i) => {
      const alto = tope ? (m.base / tope) * 100 : 0;
      const etiqueta = `${MES_L[m.d.getMonth()]} ${m.d.getFullYear()}: ${eur(m.base)}${m.n ? ` en ${plural(m.n, 'factura', 'facturas')}` : ''}`;
      return `<div class="g-col ${m.actual ? 'actual' : ''} ${i % 2 ? 'impar' : ''}" tabindex="0" role="img" aria-label="${esc(etiqueta)}" data-tip="${esc(etiqueta)}">
        <div class="g-barra-zona">${m.actual && m.base ? `<span class="g-valor" style="bottom:calc(${alto}% + 6px)">${eurEje(m.base)}</span>` : ''}<i style="height:${alto}%"></i></div>
        <span class="g-mes">${MES[m.d.getMonth()]}</span></div>`;
    }).join('');
    return `<section class="card res-ingresos" aria-labelledby="tIng">
      <div class="res-tit"><h2 id="tIng">Facturado en ${MES_L[ahora.getMonth()]}</h2><a href="#facturas" class="res-link">Facturas</a></div>
      <div class="res-hero"><p class="cifra-hero">${eur(esteMes.base)}</p><p class="res-comp">${chip}<span>${comp}</span></p></div>
      <p class="muted res-nota">Base sin IVA de las facturas emitidas (no cuenta borradores ni anuladas).</p>
      <div class="grafico" id="grafico">
        <div class="g-area">${lineas}<div class="g-cols">${cols}</div></div>
        ${total12 ? '' : '<p class="g-vacio">Aún no hay facturas en los últimos 12 meses. Cuando emitáis la primera, aparecerá aquí.</p>'}
        <div class="g-tip" id="gTip" hidden></div>
      </div>
      <dl class="res-mini">
        <div><dt>Últimos 12 meses</dt><dd>${eur(total12)}</dd></div>
        <div><dt>Factura media</dt><dd>${n12 ? eur(Math.round(total12 / n12)) : '—'}</dd></div>
        <div><dt>Facturas emitidas</dt><dd>${n12}</dd></div>
      </dl>
    </section>`;
  }

  function tarjetaDinero() {
    const pctV = sumaCobrar ? Math.max(4, (sumaVencido / sumaCobrar) * 100) : 0;
    return `<section class="card res-dinero" aria-labelledby="tDin">
      <div class="res-tit"><h2 id="tDin">Dinero pendiente</h2></div>
      <div class="din-fila">
        <div class="din-cab"><span>Por cobrar</span><b>${eur(sumaCobrar)}</b></div>
        ${sumaCobrar ? `<div class="medidor" role="img" aria-label="${esc(eur(sumaVencido))} vencido de ${esc(eur(sumaCobrar))}"><i class="m-vencido" style="width:${sumaVencido ? pctV : 0}%"></i></div>` : ''}
        <p class="din-nota ${vencidas.length ? 'bad' : sumaCobrar ? 'ok' : ''}">${vencidas.length
          ? `<span class="i i-alerta" aria-hidden="true"></span>${eur(sumaVencido)} vencido en ${plural(vencidas.length, 'factura', 'facturas')}`
          : sumaCobrar ? `<span class="i i-ok" aria-hidden="true"></span>Nada vencido · ${plural(porCobrar.length, 'factura', 'facturas')} en plazo` : 'No hay facturas pendientes de cobro.'}</p>
      </div>
      <div class="din-fila">
        <div class="din-cab"><span>Presupuestos enviados</span><b>${eur(sumaPresu)}</b></div>
        <p class="din-nota">${presupuestos.length ? `${plural(presupuestos.length, 'presupuesto esperando', 'presupuestos esperando')} respuesta${presuViejo > 14 ? ` · el más antiguo, de hace ${presuViejo} días` : ''}` : 'Ninguno esperando respuesta.'}</p>
      </div>
      <div class="din-fila">
        <div class="din-cab"><span>IVA del ${triIva + 1}T ${anioIva !== ahora.getFullYear() ? anioIva : ''}</span><b>${eur(iva)}</b></div>
        <p class="din-nota">${ivaTexto}</p>
      </div>
    </section>`;
  }

  function tarjetaAtencion() {
    const lista = tareas.slice(0, 6);
    const resto = tareas.length - lista.length;
    const etiqueta = { bad: 'Urgente', warn: 'Pendiente', info: 'Para hoy' };
    return `<section class="card res-atencion" aria-labelledby="tAt">
      <div class="res-tit"><h2 id="tAt">Requiere atención</h2>${tareas.length ? `<span class="muted">${tareas.length}</span>` : ''}</div>
      ${lista.length ? `<ul class="tareas">${lista.map((x) => `
        <li><a href="${esc(x.ir)}" class="tarea ${x.g}">
          <span class="tarea-ico" title="${etiqueta[x.g]}"><span class="i i-${ICO[x.g]}" aria-hidden="true"></span><span class="visualmente-oculto">${etiqueta[x.g]}:</span></span>
          <span class="tarea-txt"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span>
          <span class="i i-flecha tarea-ir" aria-hidden="true"></span></a></li>`).join('')}</ul>
        ${resto > 0 ? `<p class="muted tareas-mas">Y ${plural(resto, 'cosa más', 'cosas más')} de menor prioridad.</p>` : ''}`
      : `<div class="tareas-ok"><span class="i i-ok" aria-hidden="true"></span><div><b>Nada urgente</b><p class="muted">Cobros, entregas y mensajes están al día. Buen momento para escribir a los clientes potenciales.</p></div></div>`}
    </section>`;
  }

  function tarjetaCartera() {
    const filas = [['activo', 'Activos'], ['potencial', 'Potenciales'], ['pausado', 'Pausados'], ['antiguo', 'Antiguos']];
    const maxE = Math.max(1, ...Object.values(est));
    return `<section class="card res-cartera" aria-labelledby="tCar">
      <div class="res-tit"><h2 id="tCar">Clientes</h2><a href="#clientes" class="res-link">Ver todos</a></div>
      <ul class="cartera">${filas.map(([k, l]) => `<li class="c-${k}"><span>${l}</span><span class="c-barra"><i style="width:${(est[k] / maxE) * 100}%"></i></span><b>${est[k] || 0}</b></li>`).join('')}</ul>
      <dl class="res-mini dos-col">
        <div><dt>Nuevos este mes</dt><dd>${nuevosMes}</dd></div>
        <div><dt>Activos sin proyecto</dt><dd>${sinProyecto.length}</dd></div>
      </dl>
      ${sinProyecto.length ? `<p class="muted res-nota">Sin proyecto en marcha: ${sinProyecto.slice(0, 3).map((c) => `<a href="#cliente/${c.id}">${esc(nombreCli(c))}</a>`).join(', ')}${sinProyecto.length > 3 ? '…' : ''}. Quizá les interese mantenimiento o una mejora.</p>` : ''}
    </section>`;
  }

  function tarjetaProduccion() {
    const totalA = activos.length;
    const segs = FASES.map((f, i) => porFase[f] ? `<i class="f${i}" style="flex-grow:${porFase[f]}" title="${ESTADOS[f]}: ${porFase[f]}"></i>` : '').join('');
    return `<section class="card res-produccion" aria-labelledby="tPro">
      <div class="res-tit"><h2 id="tPro">Producción</h2><a href="#proyectos" class="res-link">Proyectos</a></div>
      ${totalA ? `
        <div class="fases-barra" role="img" aria-label="${FASES.map((f) => `${ESTADOS[f]}: ${porFase[f]}`).join(', ')}">${segs}</div>
        <ul class="fases-leyenda">${FASES.map((f, i) => `<li><i class="f${i}"></i>${ESTADOS[f]} <b>${porFase[f]}</b></li>`).join('')}<li class="muted">Entregados <b>${entregados}</b></li></ul>
        <div class="tabla-wrap"><table class="cola">
          <thead><tr><th>Proyecto</th><th>Fase</th><th>Progreso</th><th>Entrega</th></tr></thead>
          <tbody>${cola.slice(0, 6).map((p) => {
            const d = p.fecha_entrega ? diasHasta(p.fecha_entrega) : null;
            const cls = d === null ? 'muted' : d < 0 ? 'bad' : d <= 7 ? 'warn' : '';
            return `<tr class="click" data-go="#proyecto/${p.id}">
              <td><b>${esc(p.nombre)}</b><small>${esc(nombreCli(p.clientes))}</small></td>
              <td><span class="tag">${ESTADOS[p.estado] || p.estado}</span></td>
              <td><div class="prog"><div class="barra"><i style="width:${p.progreso}%"></i></div><span>${p.progreso} %</span></div></td>
              <td class="entrega ${cls}">${d === null ? 'Sin fecha' : `${d < 0 ? 'Atrasada · ' : ''}${fechaCorta(p.fecha_entrega)}<small>${enDias(d)}</small>`}</td></tr>`;
          }).join('')}</tbody></table></div>
        ${cola.length > 6 ? `<p class="muted res-nota">Y ${cola.length - 6} más en <a href="#proyectos">Proyectos</a>.</p>` : ''}`
      : `<div class="vacio">No hay proyectos en marcha. ${entregados ? `Lleváis ${plural(entregados, 'proyecto entregado', 'proyectos entregados')}.` : ''} Crea uno desde <a href="#proyectos">Proyectos</a>.</div>`}
    </section>`;
  }
}

// Escala redonda para el eje: 1, 2, 2,5 o 5 × 10ⁿ
function escalaBonita(max) {
  if (!max) return 1000;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

// Tooltip del gráfico (ratón, dedo y teclado)
function activarGrafico() {
  const g = document.getElementById('grafico'); if (!g) return;
  const tip = document.getElementById('gTip');
  const mostrar = (col) => {
    tip.textContent = col.dataset.tip;
    tip.hidden = false;
    const r = col.getBoundingClientRect(), rg = g.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - rg.left, 70), rg.width - 70);
    tip.style.left = x + 'px';
  };
  const ocultar = () => { tip.hidden = true; };
  g.querySelectorAll('.g-col').forEach((c) => {
    c.addEventListener('mouseenter', () => mostrar(c));
    c.addEventListener('focus', () => mostrar(c));
    c.addEventListener('click', () => mostrar(c));
    c.addEventListener('mouseleave', ocultar);
    c.addEventListener('blur', ocultar);
  });
}

  return { vResumen };
}
