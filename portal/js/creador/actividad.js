import { crearXlsx, crearCsv, entregar, celdaDia, celdaHora } from './exportar.js';

export function crearActividad({ sb, vista, esc, toast }) {
const LOTE = 1000;
const MAXIMO = 50000;
const COLUMNAS = 'creada,pagina,tipo,detalle,entrada,referente,campana,dispositivo,idioma,zona';
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIA_SEM = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

const PERIODOS = {
  7: { nombre: '7 días', grupo: 'dia', frase: 'los últimos 7 días', antes: 'los 7 días anteriores', por: 'día' },
  30: { nombre: '30 días', grupo: 'dia', frase: 'los últimos 30 días', antes: 'los 30 días anteriores', por: 'día' },
  90: { nombre: '3 meses', grupo: 'semana', frase: 'las últimas 13 semanas', antes: 'las 13 semanas anteriores', por: 'semana' },
  365: { nombre: '12 meses', grupo: 'mes', frase: 'los últimos 12 meses', antes: 'los 12 meses anteriores', por: 'mes' },
};

const PAGINAS = {
  '/': 'Inicio',
  '/proyectos': 'Proyectos',
  '/legal': 'Aviso legal',
  '/web': 'Diseño web',
  '/presencia-digital': 'Presencia digital',
  '/servicios-y-sistemas': 'Servicios y sistemas',
  '/automatizacion': 'Automatización',
  '/cloud-y-seguridad': 'Cloud y seguridad',
  '/datos-y-bi': 'Datos y BI',
  '/integracion-de-sistemas': 'Integración de sistemas',
  '/inteligencia-artificial': 'Inteligencia artificial',
  '/software-a-medida': 'Software a medida',
};

const DISPOSITIVOS = { movil: 'Móvil', ordenador: 'Ordenador', tableta: 'Tableta' };
const CONTACTOS = { whatsapp: 'WhatsApp', correo: 'Correo', formulario: 'Formulario', telefono: 'Teléfono' };
const IDIOMAS = {
  es: 'Español', fr: 'Francés', it: 'Italiano', en: 'Inglés', de: 'Alemán', pt: 'Portugués',
  ca: 'Catalán', eu: 'Euskera', gl: 'Gallego', nl: 'Neerlandés', ar: 'Árabe', ro: 'Rumano',
};
const CAMPANAS = {
  tarjeta: 'Tarjeta (QR)', qr: 'Código QR', instagram: 'Instagram', facebook: 'Facebook',
  linkedin: 'LinkedIn', whatsapp: 'WhatsApp', tiktok: 'TikTok', google: 'Google', correo: 'Correo', email: 'Correo',
  disputatio: 'Web de Disputatio', airbnb: 'Web Airbnb',
};
const PAISES = {
  'Europe/Madrid': 'España', 'Atlantic/Canary': 'España', 'Africa/Ceuta': 'España',
  'Europe/Paris': 'Francia', 'Europe/Rome': 'Italia', 'Europe/London': 'Reino Unido', 'Europe/Lisbon': 'Portugal',
  'Atlantic/Madeira': 'Portugal', 'Atlantic/Azores': 'Portugal', 'Europe/Berlin': 'Alemania', 'Europe/Brussels': 'Bélgica',
  'Europe/Zurich': 'Suiza', 'Europe/Amsterdam': 'Países Bajos', 'Europe/Dublin': 'Irlanda', 'Europe/Luxembourg': 'Luxemburgo',
  'Europe/Monaco': 'Mónaco', 'Europe/Andorra': 'Andorra', 'Europe/Vienna': 'Austria', 'Europe/Warsaw': 'Polonia',
  'Europe/Bucharest': 'Rumanía', 'Africa/Casablanca': 'Marruecos', 'Africa/Dakar': 'Senegal', 'Africa/Algiers': 'Argelia',
  'America/Argentina/Buenos_Aires': 'Argentina', 'America/Buenos_Aires': 'Argentina', 'America/Montevideo': 'Uruguay',
  'America/Mexico_City': 'México', 'America/Bogota': 'Colombia', 'America/Santiago': 'Chile', 'America/Lima': 'Perú',
  'America/Caracas': 'Venezuela', 'America/New_York': 'EE. UU.', 'America/Chicago': 'EE. UU.', 'America/Denver': 'EE. UU.',
  'America/Los_Angeles': 'EE. UU.', 'America/Toronto': 'Canadá', 'America/Montreal': 'Canadá',
};

let ultimo = null;

const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const lunesDe = (d) => sumarDias(inicioDia(d), -((d.getDay() + 6) % 7));
const numero = (n) => Number(n || 0).toLocaleString('es-ES');
const plural = (n, uno, varios) => `${numero(n)} ${n === 1 ? uno : varios}`;
const porcentaje = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fechaCorta = (d) => `${d.getDate()} ${MES[d.getMonth()]}`;
const fechaArchivo = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hora = (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const leerLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

const nombrePagina = (p) => PAGINAS[p] || p;
const nombreDispositivo = (d) => DISPOSITIVOS[d] || 'Sin dato';
const nombreIdioma = (i) => (i ? IDIOMAS[i.slice(0, 2)] || i.toUpperCase() : 'Sin dato');
const nombreContacto = (c) => CONTACTOS[c] || c || 'Otro';

function pais(zona) {
  if (!zona) return 'Sin dato';
  return PAISES[zona] || zona.split('/').pop().replace(/_/g, ' ');
}

function origen(v) {
  const c = (v.campana || '').toLowerCase();
  if (c) return CAMPANAS[c] || `Campaña «${c}»`;
  const r = (v.referente || '').replace(/^www\./, '');
  if (!r) return 'Directo o app';
  if (/(^|\.)google\.[a-z.]+$/.test(r)) return 'Google';
  if (/(^|\.)(bing|duckduckgo|ecosia|qwant|yahoo|yandex)\./.test(r)) return 'Otros buscadores';
  if (/(^|\.)instagram\.com$/.test(r)) return 'Instagram';
  if (/(^|\.)(facebook\.com|fb\.me|fb\.com)$/.test(r)) return 'Facebook';
  if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(r)) return 'LinkedIn';
  if (/(^|\.)whatsapp\.(com|net)$/.test(r)) return 'WhatsApp';
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(r)) return 'X (Twitter)';
  if (/(^|\.)tiktok\.com$/.test(r)) return 'TikTok';
  if (/(^|\.)(github\.io|github\.com)$/.test(r)) return 'GitHub';
  return r;
}

function cubetas(periodo, dias, ahora) {
  const lista = [];
  if (periodo.grupo === 'dia') {
    const hoy = inicioDia(ahora);
    for (let i = dias - 1; i >= 0; i--) {
      const inicio = sumarDias(hoy, -i);
      lista.push({
        inicio, fin: sumarDias(inicio, 1),
        etiqueta: dias <= 7 ? `${DIA_SEM[inicio.getDay()]} ${inicio.getDate()}` : String(inicio.getDate()),
        titulo: inicio.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
        visible: dias <= 7 || i % 5 === 0,
      });
    }
  } else if (periodo.grupo === 'semana') {
    const esta = lunesDe(ahora);
    for (let i = 12; i >= 0; i--) {
      const inicio = sumarDias(esta, -7 * i);
      const fin = sumarDias(inicio, 7);
      lista.push({
        inicio, fin, etiqueta: fechaCorta(inicio),
        titulo: `Semana del ${fechaCorta(inicio)} al ${fechaCorta(sumarDias(fin, -1))}`,
        visible: i % 2 === 0,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      lista.push({
        inicio, fin: new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1), etiqueta: MES[inicio.getMonth()],
        titulo: `${MES_L[inicio.getMonth()]} de ${inicio.getFullYear()}`,
        visible: true, impar: i % 2 === 1,
      });
    }
  }
  for (const c of lista) Object.assign(c, { visitas: 0, vistas: 0, contactos: 0 });
  lista[lista.length - 1].actual = true;
  return { lista, desde: lista[0].inicio, hasta: lista[lista.length - 1].fin };
}

function repartir(filas, lista) {
  let i = 0;
  for (const v of filas) {
    const t = v.fecha.getTime();
    while (i < lista.length - 1 && t >= lista[i].fin.getTime()) i++;
    const c = lista[i];
    if (v.tipo === 'contacto') c.contactos++;
    else { c.vistas++; if (v.entrada) c.visitas++; }
  }
}

async function traer(desde, hasta) {
  const filas = [];
  for (let i = 0; filas.length < MAXIMO; i += LOTE) {
    const { data, error } = await sb.from('visitas').select(COLUMNAS)
      .gte('creada', desde.toISOString()).lt('creada', hasta.toISOString())
      .order('creada', { ascending: true }).range(i, i + LOTE - 1);
    if (error) throw error;
    filas.push(...data);
    if (data.length < LOTE) break;
  }
  return filas.map((v) => ({ ...v, fecha: new Date(v.creada) }));
}

async function contarRango(desde, hasta) {
  const base = () => sb.from('visitas').select('id', { count: 'exact', head: true })
    .gte('creada', desde.toISOString()).lt('creada', hasta.toISOString());
  const [v, p, c] = await Promise.all([
    base().eq('tipo', 'vista').eq('entrada', true),
    base().eq('tipo', 'vista'),
    base().eq('tipo', 'contacto'),
  ]);
  const error = [v, p, c].find((r) => r.error)?.error;
  if (error) throw error;
  return { visitas: v.count || 0, vistas: p.count || 0, contactos: c.count || 0 };
}

function contarPor(lista, clave) {
  const m = new Map();
  for (const x of lista) { const k = clave(x); m.set(k, (m.get(k) || 0) + 1); }
  return [...m].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}

function recortar(items, max) {
  if (items.length <= max) return items;
  const resto = items.slice(max - 1).reduce((s, x) => s + x.n, 0);
  return [...items.slice(0, max - 1), { nombre: 'Otras', n: resto, otras: true }];
}

function calcular(filas, lista) {
  const vistas = filas.filter((v) => v.tipo === 'vista');
  const entradas = vistas.filter((v) => v.entrada);
  const contactos = filas.filter((v) => v.tipo === 'contacto');
  repartir(filas, lista);
  return {
    vistas, entradas, contactos,
    paginas: contarPor(vistas, (v) => v.pagina),
    origenes: contarPor(entradas, origen),
    dispositivos: contarPor(entradas, (v) => nombreDispositivo(v.dispositivo)),
    paises: contarPor(entradas, (v) => pais(v.zona)),
    idiomas: contarPor(entradas, (v) => nombreIdioma(v.idioma)),
    tiposContacto: contarPor(contactos, (v) => nombreContacto(v.detalle)),
  };
}

function escalaEntera(max) {
  if (max <= 2) return 2;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [2, 4, 6, 8, 10]) if (m * p >= max) return m * p;
  return 20 * p;
}

function chipDelta(ahora, antes) {
  if (!antes) return '';
  const d = Math.round(((ahora - antes) / antes) * 100);
  return `<span class="delta ${d >= 0 ? 'sube' : 'baja'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)} %</span>`;
}

function cabecera(dias, listo) {
  return `
    <div class="cabecera act-cab">
      <div><p class="eyebrow">a2wdstudio.com</p><h1>Actividad de la web</h1></div>
      <div class="act-acc">
        <nav class="act-periodos" aria-label="Periodo">${Object.entries(PERIODOS).map(([k, p]) =>
          `<a href="#actividad/${k}"${Number(k) === dias ? ' aria-current="page"' : ''}>${p.nombre}</a>`).join('')}</nav>
        <details class="act-exportar"${listo ? '' : ' hidden'}>
          <summary class="btn ghost small" aria-label="Exportar"><span class="i i-descargar" aria-hidden="true"></span><span class="act-exp-txt">Exportar</span></summary>
          <div class="act-menu">
            <button type="button" data-exp="xlsx">Excel con todo<small>.xlsx · resumen, por día, páginas, procedencia y registro</small></button>
            <button type="button" data-exp="dia">CSV · visitas por día<small>Fecha, visitas, páginas vistas y contactos</small></button>
            <button type="button" data-exp="registro">CSV · registro completo<small>Una fila por página vista o contacto</small></button>
            <p>Para verlo en Drive: súbelo a Google Drive y ábrelo con Hojas de cálculo. En el móvil, elige «Drive» al compartir.</p>
          </div>
        </details>
      </div>
    </div>`;
}

function tarjetaKpi(titulo, valor, extra) {
  return `<div class="card kpi"><p class="eyebrow">${titulo}</p><p class="v">${valor}</p><p class="act-delta">${extra}</p></div>`;
}

function grafico(lista, periodo) {
  const max = Math.max(...lista.map((c) => c.visitas));
  const tope = escalaEntera(max);
  const lineas = [tope, tope / 2].map((v) => `<div class="g-linea" style="bottom:${(v / tope) * 100}%"><span>${numero(v)}</span></div>`).join('');
  const cols = lista.map((c) => {
    const alto = (c.visitas / tope) * 100;
    const texto = `${c.titulo}: ${plural(c.visitas, 'visita', 'visitas')} · ${plural(c.vistas, 'página vista', 'páginas vistas')}${c.contactos ? ` · ${plural(c.contactos, 'contacto', 'contactos')}` : ''}`;
    const clases = ['g-col', c.actual ? 'actual' : '', c.visible ? '' : 'sin-etiqueta', c.impar ? 'impar' : ''].join(' ');
    const valor = c.actual && c.visitas ? `<span class="g-valor" style="bottom:calc(${alto}% + 6px)">${numero(c.visitas)}</span>` : '';
    return `<div class="${clases}" tabindex="0" role="img" aria-label="${esc(texto)}" data-tip="${esc(texto)}">
      <div class="g-barra-zona">${valor}<i style="height:${alto}%"></i></div><span class="g-mes">${esc(c.etiqueta)}</span></div>`;
  }).join('');
  return `<section class="card act-tiempo" aria-labelledby="tActT">
    <div class="res-tit"><h2 id="tActT">Visitas por ${periodo.por}</h2><span class="muted">${esc(fechaCorta(lista[0].inicio))} – hoy</span></div>
    <div class="grafico act-grafico" id="actGrafico">
      <div class="g-area">${lineas}<div class="g-cols" style="grid-template-columns:repeat(${lista.length},minmax(0,1fr))">${cols}</div></div>
      <div class="g-tip" id="actTip" hidden></div>
    </div>
  </section>`;
}

function listaBarras(items, total, max, vacio) {
  if (!items.length) return `<p class="muted act-vacio">${vacio}</p>`;
  const recortados = recortar(items, max);
  const mayor = Math.max(...recortados.map((x) => x.n));
  return `<ul class="act-lista">${recortados.map((x) => `
    <li${x.otras ? ' class="otras"' : ''}><span class="act-nom" title="${esc(x.nombre)}">${esc(x.nombre)}</span>
      <span class="c-barra" aria-hidden="true"><i style="width:${(x.n / mayor) * 100}%"></i></span>
      <b>${numero(x.n)}</b><small>${porcentaje(x.n, total)} %</small></li>`).join('')}</ul>`;
}

function tarjetaLista(id, titulo, nota, items, total, vacio) {
  return `<section class="card" aria-labelledby="${id}">
    <div class="res-tit"><h2 id="${id}">${titulo}</h2></div>
    ${listaBarras(items, total, 7, vacio)}
    ${nota ? `<p class="act-nota">${nota}</p>` : ''}
  </section>`;
}

function tablaUltimas(filas) {
  const ultimas = filas.slice(-15).reverse();
  if (!ultimas.length) return '';
  return `<section class="card act-ultimas" aria-labelledby="tActU">
    <div class="res-tit"><h2 id="tActU">Últimos movimientos</h2><span class="muted">${ultimas.length} más recientes</span></div>
    <div class="tabla-wrap"><table class="cola">
      <thead><tr><th>Qué</th><th>Cuándo</th><th>Desde dónde</th></tr></thead>
      <tbody>${ultimas.map((v) => {
        const que = v.tipo === 'contacto'
          ? `<b><span class="tag ok">Contacto</span> ${esc(nombreContacto(v.detalle))}</b><small>en ${esc(nombrePagina(v.pagina))}</small>`
          : `<b>${esc(nombrePagina(v.pagina))}</b><small>${v.entrada ? `Entrada · ${esc(origen(v))}` : 'Navegando por la web'}</small>`;
        const donde = [nombreDispositivo(v.dispositivo), pais(v.zona), v.idioma ? nombreIdioma(v.idioma) : ''].filter(Boolean).join(' · ');
        return `<tr><td>${que}</td><td class="act-cuando">${esc(fechaCorta(v.fecha))}<small>${esc(hora(v.fecha))}</small></td><td><small>${esc(donde)}</small></td></tr>`;
      }).join('')}</tbody>
    </table></div>
  </section>`;
}

function pie() {
  const excluido = leerLocal('a2wd_equipo') === '1';
  return `<p class="act-pie"><b>Cómo se cuenta.</b> Cada página que se abre en a2wdstudio.com, sin cookies ni datos personales.
    Una <b>visita</b> es una llegada desde fuera (Google, Instagram, un enlace, el QR o escribiendo la dirección); lo que se ve después dentro de la web suma <b>páginas vistas</b>.
    Un <b>contacto</b> es pulsar WhatsApp, el correo o enviar el formulario. El país sale de la zona horaria del navegador.
    ${excluido ? 'Este dispositivo no cuenta, para que vuestras visitas no inflen los números.' : ''}
    Para saber cuántos llegan por la tarjeta, el QR debe llevar <code>?utm_source=tarjeta</code>.</p>`;
}

function activarGrafico() {
  const g = document.getElementById('actGrafico');
  if (!g) return;
  const tip = document.getElementById('actTip');
  const mostrar = (col) => {
    tip.textContent = col.dataset.tip;
    tip.hidden = false;
    const r = col.getBoundingClientRect();
    const rg = g.getBoundingClientRect();
    const medio = tip.offsetWidth / 2 + 4;
    tip.style.left = Math.min(Math.max(r.left + r.width / 2 - rg.left, medio), rg.width - medio) + 'px';
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

function filasPorDia({ filas, desde, ahora }) {
  const dias = [];
  for (let d = inicioDia(desde); d <= ahora; d = sumarDias(d, 1)) dias.push({ inicio: d, fin: sumarDias(d, 1), visitas: 0, vistas: 0, contactos: 0 });
  repartir(filas, dias);
  return [['Fecha', 'Visitas', 'Páginas vistas', 'Contactos'],
    ...dias.map((d) => [celdaDia(d.inicio), d.visitas, d.vistas, d.contactos])];
}

function filasRegistro({ filas }) {
  return [['Fecha y hora', 'Tipo', 'Página', 'Nombre de la página', 'Contacto', 'Visita nueva', 'Procedencia', 'Web de origen', 'Campaña', 'Dispositivo', 'Idioma', 'Zona horaria', 'País'],
    ...filas.map((v) => [
      celdaHora(v.fecha), v.tipo === 'contacto' ? 'Contacto' : 'Página vista', v.pagina, nombrePagina(v.pagina),
      v.tipo === 'contacto' ? nombreContacto(v.detalle) : '', v.entrada ? 'Sí' : 'No',
      v.entrada ? origen(v) : '', v.referente || '', v.campana || '', nombreDispositivo(v.dispositivo),
      nombreIdioma(v.idioma), v.zona || '', pais(v.zona),
    ])];
}

function hojasExcel(u) {
  const { r, periodo, desde, ahora, antes } = u;
  const tabla = (titulo, items, total) => [[titulo, 'Visitas', '% del total'], ...items.map((x) => [x.nombre, x.n, total ? Math.round((x.n / total) * 1000) / 10 : 0])];
  return [
    { nombre: 'Resumen', filas: [
      ['Dato', 'Valor', 'Periodo anterior'],
      ['Periodo', `${fechaArchivo(desde)} a ${fechaArchivo(ahora)} (${periodo.frase})`, ''],
      ['Visitas', r.entradas.length, antes.visitas],
      ['Páginas vistas', r.vistas.length, antes.vistas],
      ['Páginas por visita', r.entradas.length ? Math.round((r.vistas.length / r.entradas.length) * 10) / 10 : 0, antes.visitas ? Math.round((antes.vistas / antes.visitas) * 10) / 10 : 0],
      ['Contactos', r.contactos.length, antes.contactos],
      ['Exportado', celdaHora(new Date()), ''],
    ] },
    { nombre: 'Por día', filas: filasPorDia(u) },
    { nombre: 'Páginas', filas: [['Página', 'Dirección', 'Páginas vistas', '% del total'],
      ...r.paginas.map((x) => [nombrePagina(x.nombre), x.nombre, x.n, Math.round((x.n / r.vistas.length) * 1000) / 10])] },
    { nombre: 'Procedencia', filas: tabla('Procedencia', r.origenes, r.entradas.length) },
    { nombre: 'Dispositivos', filas: tabla('Dispositivo', r.dispositivos, r.entradas.length) },
    { nombre: 'Países', filas: tabla('País (zona horaria)', r.paises, r.entradas.length) },
    { nombre: 'Idiomas', filas: tabla('Idioma del navegador', r.idiomas, r.entradas.length) },
    { nombre: 'Contactos', filas: [['Tipo de contacto', 'Contactos'], ...r.tiposContacto.map((x) => [x.nombre, x.n])] },
    { nombre: 'Registro', filas: filasRegistro(u) },
  ];
}

async function exportar(tipo) {
  if (!ultimo) return;
  const base = `a2wd-actividad-${fechaArchivo(ultimo.desde)}_${fechaArchivo(ultimo.ahora)}`;
  try {
    if (tipo === 'xlsx') await entregar(crearXlsx(hojasExcel(ultimo)), `${base}.xlsx`);
    if (tipo === 'dia') await entregar(crearCsv(filasPorDia(ultimo)), `${base}-por-dia.csv`);
    if (tipo === 'registro') await entregar(crearCsv(filasRegistro(ultimo)), `${base}-registro.csv`);
  } catch (e) {
    toast('No se ha podido crear el archivo: ' + e.message, 'bad');
  }
}

function alPulsar(e) {
  const menu = vista.querySelector('.act-exportar[open]');
  if (!menu) return;
  const b = e.target.closest('[data-exp]');
  if (b && menu.contains(b)) { menu.open = false; exportar(b.dataset.exp); return; }
  if (!menu.contains(e.target)) menu.open = false;
}

function pintar(u) {
  const { r, lista, periodo, dias, antes, recortado } = u;
  const visitas = r.entradas.length;
  const vistas = r.vistas.length;
  const contactos = r.contactos.length;
  const moviles = r.entradas.filter((v) => v.dispositivo === 'movil').length;
  const frase = vistas || contactos
    ? `En ${periodo.frase}, <b>${plural(visitas, 'visita', 'visitas')}</b> y <b>${plural(vistas, 'página vista', 'páginas vistas')}</b>${contactos ? `, con <b>${plural(contactos, 'intento de contacto', 'intentos de contacto')}</b>` : ''}.`
    : `Todavía no hay visitas en ${periodo.frase}. Se cuentan desde que este cambio está publicado en a2wdstudio.com.`;
  const comparado = `frente a ${periodo.antes}`;

  vista.innerHTML = `${cabecera(dias, true)}
    <p class="act-frase">${frase}</p>
    ${recortado ? `<p class="act-nota">Hay más de ${numero(MAXIMO)} registros en este periodo: se muestran los primeros. Elige un periodo más corto o exporta por partes.</p>` : ''}
    <div class="kpis act-kpis">
      ${tarjetaKpi('Visitas', numero(visitas), antes.visitas ? `${chipDelta(visitas, antes.visitas)}<span>${comparado}</span>` : '<span>Llegadas desde fuera de la web</span>')}
      ${tarjetaKpi('Páginas vistas', numero(vistas), antes.vistas ? `${chipDelta(vistas, antes.vistas)}<span>${comparado}</span>` : '<span>Todas las páginas abiertas</span>')}
      ${tarjetaKpi('Páginas por visita', visitas ? (vistas / visitas).toLocaleString('es-ES', { maximumFractionDigits: 1 }) : '—', `<span>${visitas ? `${porcentaje(moviles, visitas)} % desde el móvil` : 'Sin visitas todavía'}</span>`)}
      ${tarjetaKpi('Contactos', numero(contactos), `<span>${visitas ? `${porcentaje(contactos, visitas)} % de las visitas` : 'WhatsApp, correo y formulario'}</span>`)}
    </div>
    ${grafico(lista, periodo)}
    <div class="act-grid">
      ${tarjetaLista('tActP', 'Páginas más vistas', '', r.paginas.map((x) => ({ nombre: nombrePagina(x.nombre), n: x.n })), vistas, 'Aún no se ha abierto ninguna página.')}
      ${tarjetaLista('tActO', 'De dónde llegan', 'Sobre las visitas. «Directo o app»: escribieron la dirección, usaron un marcador o la app no dice de dónde vienen.', r.origenes, visitas, 'Aún no hay visitas.')}
      ${tarjetaLista('tActD', 'Dispositivo', '', r.dispositivos, visitas, 'Aún no hay visitas.')}
      ${tarjetaLista('tActC', 'Contactos', '', r.tiposContacto, contactos, 'Nadie ha pulsado todavía WhatsApp, el correo ni el formulario.')}
      ${tarjetaLista('tActS', 'País', 'Según la zona horaria del navegador.', r.paises, visitas, 'Aún no hay visitas.')}
      ${tarjetaLista('tActI', 'Idioma del navegador', '', r.idiomas, visitas, 'Aún no hay visitas.')}
    </div>
    ${tablaUltimas(u.filas)}
    ${pie()}`;
  activarGrafico();
}

function pintarError(dias, error) {
  const falta = /visitas|PGRST205|42P01|schema cache/i.test(`${error.code} ${error.message}`);
  vista.innerHTML = `${cabecera(dias, false)}
    <div class="vacio">${falta
      ? 'La tabla de visitas todavía no existe en Supabase. Hay que ejecutar <code>supabase/actividad.sql</code> en el SQL Editor (lo explica <code>docs/ACTIVIDAD.md</code>).'
      : `No se ha podido cargar la actividad (${esc(error.message || String(error))}). Comprueba la conexión y recarga la página.`}</div>`;
}

async function vActividad(id) {
  const dias = PERIODOS[id] ? Number(id) : 30;
  const periodo = PERIODOS[dias];
  vista.innerHTML = `${cabecera(dias, false)}<p class="muted">Cargando la actividad…</p>`;
  const marca = vista.querySelector('.act-cab');
  const ahora = new Date();
  const { lista, desde, hasta } = cubetas(periodo, dias, ahora);
  let filas;
  let antes;
  try {
    [filas, antes] = await Promise.all([traer(desde, hasta), contarRango(new Date(desde.getTime() - (ahora - desde)), desde)]);
  } catch (error) {
    if (vista.contains(marca)) pintarError(dias, error);
    return;
  }
  if (!vista.contains(marca)) return;
  const r = calcular(filas, lista);
  ultimo = { filas, lista, periodo, dias, desde, ahora, antes, r, recortado: filas.length >= MAXIMO };
  pintar(ultimo);
}

document.addEventListener('click', alPulsar);

  return { vActividad };
}
