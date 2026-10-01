// Funciones compartidas para comentarios, mensajes e integración con IA.
export function crearComentarios({ sb, esc, toast, refrescar }) {
const CATEGORIAS = { duda: 'Duda', cambio_diseno: 'Cambio de diseño', contenido: 'Contenido', problema_tecnico: 'Problema técnico', facturacion: 'Facturación', aprobacion: 'Aprobación', otro: 'Otro' };
const PRIORIDADES = { baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' };
const iaDe = (c) => (Array.isArray(c?.comentarios_ia) ? c.comentarios_ia[0] : c?.comentarios_ia) || null;
const tagsIA = (a) => !a ? '' : `<span class="ia-tags"><span class="tag ${a.prioridad === 'urgente' ? 'bad' : a.prioridad === 'alta' ? 'warn' : ''}">${PRIORIDADES[a.prioridad] || a.prioridad}</span><span class="tag">${CATEGORIAS[a.categoria] || a.categoria}</span></span>`;

// ---------- Contador de mensajes sin leer ----------
async function actualizarSinLeer() {
  const { count } = await sb.from('comentarios').select('id', { count: 'exact', head: true }).eq('leido', false);
  const el = document.getElementById('nSinLeer');
  el.textContent = count || '';
  el.classList.toggle('oculto', !count);
}


function bloqueIA(c) {
  const a = iaDe(c);
  if (!a) return `<div class="ia"><button class="btn small ghost" data-analizar="${c.id}">✦ Analizar con IA</button></div>`;
  return `<div class="ia">
    <div class="ia-cab"><span class="mono muted" style="font-size:11px">✦ ASISTENTE</span>${tagsIA(a)}</div>
    <p>${esc(a.resumen)}</p>
    ${a.necesita_info ? `<p class="aviso">⚠ ${esc(a.necesita_info)}</p>` : ''}
    ${a.respuesta ? `<p class="sug">${esc(a.respuesta)}</p>` : ''}
    <div class="acciones">${a.respuesta ? `<button class="btn small solid" data-usar="${c.id}">Usar respuesta</button>` : ''}<button class="btn small ghost" data-analizar="${c.id}" data-forzar="1">Volver a analizar</button></div>
  </div>`;
}

async function analizar(comentarioId, forzar, boton) {
  if (boton) { boton.disabled = true; boton.textContent = 'Analizando…'; }
  const { data, error } = await sb.functions.invoke('analizar-comentario', { body: { comentario_id: comentarioId, forzar } });
  if (error || !data?.ok) {
    let msg = error?.message || data?.error || 'error';
    try { msg = (await error.context.json()).error || msg; } catch {}
    toast('No se pudo analizar: ' + msg, 'bad');
    if (boton) { boton.disabled = false; boton.textContent = '✦ Analizar con IA'; }
    return;
  }
  refrescar();
}


  return { iaDe, tagsIA, bloqueIA, analizar, actualizarSinLeer };
}
