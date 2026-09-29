// =====================================================================
//  Actualiza la política de seguridad (CSP) de las páginas del portal.
//  La CSP solo deja ejecutar los scripts del propio portal: si alguien
//  consiguiera colar código en un mensaje, el navegador lo bloquearía.
//
//  ⚠️  Cada vez que cambies un <script> escrito DENTRO de una página del
//  portal (login, cliente o creador), ejecuta desde la carpeta de la web:
//
//        node herramientas/actualizar-csp.mjs
//
//  (o pídeselo a Claude). Si no, ese script no se ejecutará y la página
//  se quedará en blanco.
// =====================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const PAGINAS = ['portal/login.html', 'portal/cliente.html', 'portal/creador.html'];
const SUPABASE = 'vsqxcxmsvsektvsceqpx.supabase.co';

const politica = (hashes) => [
  "default-src 'self'",
  `script-src 'self' https://cdn.jsdelivr.net ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' https: data: blob:",
  `connect-src 'self' https://${SUPABASE} wss://${SUPABASE} https://cdn.jsdelivr.net`,
  "frame-src https:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

for (const pagina of PAGINAS) {
  const ruta = RAIZ + pagina;
  let html = readFileSync(ruta, 'utf8');
  const hashes = [];
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    hashes.push(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
  }
  const meta = `<meta http-equiv="Content-Security-Policy" content="${politica(hashes)}">`;
  if (/<meta http-equiv="Content-Security-Policy"[^>]*>/.test(html)) {
    html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, meta);
  } else {
    html = html.replace(/(<meta charset="[^"]*">)/i, `$1\n${meta}`);
  }
  if (!html.includes(meta)) throw new Error(`No se pudo poner la CSP en ${pagina}`);
  writeFileSync(ruta, html);
  console.log(`${pagina}: ${hashes.length} script(s) autorizados`);
}
