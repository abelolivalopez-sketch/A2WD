const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PAQ = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CABECERA_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const ESTILO = { texto: 0, titulo: 1, dia: 2, hora: 3, decimal: 4 };
const DIA_EXCEL = Date.UTC(1899, 11, 30);

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export const celdaDia = (d) => ({ t: 'dia', v: d });
export const celdaHora = (d) => ({ t: 'hora', v: d });

const dos = (n) => String(n).padStart(2, '0');
const textoDia = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const textoHora = (d) => `${textoDia(d)} ${dos(d.getHours())}:${dos(d.getMinutes())}`;

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(archivos, tipo) {
  const utf8 = new TextEncoder();
  const locales = [];
  const centrales = [];
  let posicion = 0;
  for (const { nombre, texto } of archivos) {
    const n = utf8.encode(nombre);
    const datos = utf8.encode(texto);
    const crc = crc32(datos);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(12, 33, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, n.length, true);
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(14, 33, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, datos.length, true);
    central.setUint32(24, datos.length, true);
    central.setUint16(28, n.length, true);
    central.setUint32(42, posicion, true);
    locales.push(local, n, datos);
    centrales.push(central, n);
    posicion += 30 + n.length + datos.length;
  }
  const tamCentral = centrales.reduce((s, p) => s + p.byteLength, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, posicion, true);
  return new Blob([...locales, ...centrales, fin], { type: tipo });
}

function xml(s) {
  return String(s)
    .replace(/[^\x09\x0A\x0D\x20-퟿-�]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function columna(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function serialExcel(d, conHora) {
  const ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), conHora ? d.getHours() : 0, conHora ? d.getMinutes() : 0, conHora ? d.getSeconds() : 0);
  return (ms - DIA_EXCEL) / 864e5;
}

function celdaXml(v, ref, primeraFila) {
  if (v === null || v === undefined || v === '') return '';
  if (primeraFila) return `<c r="${ref}" t="inlineStr" s="${ESTILO.titulo}"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  if (v && v.t === 'dia') return `<c r="${ref}" s="${ESTILO.dia}"><v>${serialExcel(v.v, false)}</v></c>`;
  if (v && v.t === 'hora') return `<c r="${ref}" s="${ESTILO.hora}"><v>${serialExcel(v.v, true)}</v></c>`;
  if (typeof v === 'number' && Number.isFinite(v)) {
    return `<c r="${ref}"${Number.isInteger(v) ? '' : ` s="${ESTILO.decimal}"`}><v>${v}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
}

function largoCelda(v) {
  if (v && v.t === 'dia') return 10;
  if (v && v.t === 'hora') return 16;
  return String(v ?? '').length;
}

function hojaXml(filas) {
  const columnas = Math.max(1, ...filas.map((f) => f.length));
  const anchos = Array.from({ length: columnas }, (_, i) =>
    Math.min(50, Math.max(9, ...filas.map((f) => largoCelda(f[i]) + 2))));
  const cols = anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const datos = filas.map((fila, r) =>
    `<row r="${r + 1}">${fila.map((v, c) => celdaXml(v, columna(c) + (r + 1), r === 0)).join('')}</row>`).join('');
  return `${CABECERA_XML}<worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0">`
    + '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    + `<cols>${cols}</cols><sheetData>${datos}</sheetData></worksheet>`;
}

function nombreHoja(s, usados) {
  let base = String(s).replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Hoja';
  let nombre = base;
  for (let i = 2; usados.has(nombre.toLowerCase()); i++) nombre = `${base.slice(0, 28)} ${i}`;
  usados.add(nombre.toLowerCase());
  return nombre;
}

const ESTILOS_XML = `${CABECERA_XML}<styleSheet xmlns="${NS}">`
  + '<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd hh:mm"/></numFmts>'
  + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
  + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="5">'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
  + '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
  + '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

export function crearXlsx(hojas) {
  const usados = new Set();
  const nombres = hojas.map((h) => nombreHoja(h.nombre, usados));
  const n = hojas.length;
  const tipos = `${CABECERA_XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '</Types>';
  const raiz = `${CABECERA_XML}<Relationships xmlns="${NS_PAQ}"><Relationship Id="rId1" Type="${NS_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const libro = `${CABECERA_XML}<workbook xmlns="${NS}" xmlns:r="${NS_REL}"><sheets>`
    + nombres.map((nom, i) => `<sheet name="${xml(nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
    + '</sheets></workbook>';
  const relLibro = `${CABECERA_XML}<Relationships xmlns="${NS_PAQ}">`
    + hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
    + `<Relationship Id="rId${n + 1}" Type="${NS_REL}/styles" Target="styles.xml"/></Relationships>`;
  return zip([
    { nombre: '[Content_Types].xml', texto: tipos },
    { nombre: '_rels/.rels', texto: raiz },
    { nombre: 'xl/workbook.xml', texto: libro },
    { nombre: 'xl/_rels/workbook.xml.rels', texto: relLibro },
    { nombre: 'xl/styles.xml', texto: ESTILOS_XML },
    ...hojas.map((h, i) => ({ nombre: `xl/worksheets/sheet${i + 1}.xml`, texto: hojaXml(h.filas) })),
  ], TIPO_XLSX);
}

function celdaCsv(v) {
  let s = v && v.t === 'dia' ? textoDia(v.v) : v && v.t === 'hora' ? textoHora(v.v) : String(v ?? '');
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function crearCsv(filas) {
  return new Blob(['﻿' + filas.map((f) => f.map(celdaCsv).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
}

export async function entregar(blob, nombre) {
  const archivo = new File([blob], nombre, { type: blob.type });
  const tactil = matchMedia('(pointer: coarse)').matches;
  if (tactil && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: nombre });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
