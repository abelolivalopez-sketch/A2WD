// Gestión del portfolio que se muestra en la web pública.
export function crearPortfolio({ sb, vista, esc, toast, fallo }) {
// =================== GESTIÓN DE LA WEB · portafolio de la página principal ===================
const WEB_PUBLICA = new URL('../index.html', location.href).href;
const IDIOMAS_WEB = [['es', 'Español'], ['fr', 'Francés'], ['it', 'Italiano'], ['en', 'Inglés']];
const imgWeb = (i) => !i ? '' : /^https?:/.test(i) ? i : new URL('../' + i, location.href).href;

async function vWeb() {
  const { data, error } = await sb.from('portfolio').select('*').order('orden').order('created_at', { ascending: false });
  if (fallo(error)) return;
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Gestión de la web</p><h1>Portafolio en la web</h1>
      <p class="muted" style="margin-top:6px;font-size:13.5px">Lo que añadas aquí aparece en la sección «Proyectos» de la página principal, en el orden de esta lista.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ghost" href="${WEB_PUBLICA}#proyectos" target="_blank" rel="noopener">Ver la web ↗</a><button class="btn solid" id="nPort">+ Añadir proyecto</button></div></div>
    <div class="port-lista">${data.length ? data.map((p, i) => `
      <div class="card port-item ${p.publicado ? '' : 'oculto-web'}">
        <div class="port-thumb">${p.imagen ? `<img src="${esc(imgWeb(p.imagen))}" alt="" loading="lazy">` : '<span class="muted mono" style="font-size:12px">Sin imagen</span>'}</div>
        <div class="port-info">
          <p class="mono muted" style="font-size:11.5px">${String(i + 1).padStart(2, '0')} · ${p.publicado ? '<span class="tag ok">Publicado</span>' : '<span class="tag">Oculto</span>'}</p>
          <h3 style="margin:4px 0">${esc(p.titulo)}</h3>
          <p class="muted" style="font-size:13px">${esc((p.descripcion?.es || '').slice(0, 140))}${(p.descripcion?.es || '').length > 140 ? '…' : ''}</p>
          <p class="mono muted" style="font-size:11.5px;margin-top:6px">${(p.etiquetas || []).map(esc).join(' · ')}${p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">abrir web ↗</a>` : ''}</p>
        </div>
        <div class="port-acc">
          <button class="btn small ghost" data-sub="${p.id}" ${i === 0 ? 'disabled' : ''} title="Subir">↑</button>
          <button class="btn small ghost" data-baj="${p.id}" ${i === data.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
          <button class="btn small ghost" data-pub="${p.id}">${p.publicado ? 'Ocultar' : 'Publicar'}</button>
          <button class="btn small ghost" data-edit="${p.id}">Editar</button>
          <button class="btn small danger" data-del="${p.id}">Borrar</button>
        </div>
      </div>`).join('') : '<div class="vacio">Aún no hay proyectos en el portafolio. Añade el primero.</div>'}</div>`;

  document.getElementById('nPort').onclick = () => formPortfolio(null, data.length);
  const porId = (id) => data.find((x) => x.id === id);
  vista.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => formPortfolio(porId(b.dataset.edit))));
  vista.querySelectorAll('[data-pub]').forEach((b) => (b.onclick = async () => {
    const p = porId(b.dataset.pub);
    const { error } = await sb.from('portfolio').update({ publicado: !p.publicado }).eq('id', p.id);
    if (!fallo(error)) { toast(p.publicado ? 'Oculto en la web' : 'Publicado en la web'); vWeb(); }
  }));
  const mover = async (id, dir) => {
    const i = data.findIndex((x) => x.id === id), j = i + dir;
    if (j < 0 || j >= data.length) return;
    const orden = data.map((x) => x.id); [orden[i], orden[j]] = [orden[j], orden[i]];
    const res = await Promise.all(orden.map((pid, k) => sb.from('portfolio').update({ orden: k + 1 }).eq('id', pid)));
    if (!fallo(res.find((r) => r.error)?.error)) vWeb();
  };
  vista.querySelectorAll('[data-sub]').forEach((b) => (b.onclick = () => mover(b.dataset.sub, -1)));
  vista.querySelectorAll('[data-baj]').forEach((b) => (b.onclick = () => mover(b.dataset.baj, 1)));
  vista.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
    const p = porId(b.dataset.del);
    if (!confirm(`¿Borrar «${p.titulo}» del portafolio? Dejará de verse en la web.`)) return;
    const { error } = await sb.from('portfolio').delete().eq('id', p.id);
    if (fallo(error)) return;
    const ruta = rutaStorage(p.imagen); if (ruta) await sb.storage.from('portfolio').remove([ruta]);
    toast('Proyecto borrado'); vWeb();
  }));
}

const rutaStorage = (url) => { const m = /\/storage\/v1\/object\/public\/portfolio\/(.+)$/.exec(url || ''); return m ? decodeURIComponent(m[1]) : null; };

// Reduce la foto (máx. 1600 px de ancho) y la convierte a WebP antes de subirla
async function prepararImagen(file) {
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, 1600 / bmp.width);
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * escala); cv.height = Math.round(bmp.height * escala);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/webp', 0.85));
  return blob || file;
}

async function formPortfolio(p, total = 0) {
  const { data: proyectos } = await sb.from('proyectos').select('id, nombre, url_preview, descripcion').order('created_at', { ascending: false });
  const d = document.createElement('dialog');
  d.className = 'port-dlg';
  d.innerHTML = `<form method="dialog" id="fPort">
    <div class="dlg-head"><h3>${p ? 'Editar proyecto del portafolio' : 'Añadir proyecto al portafolio'}</h3><button type="button" class="x" data-cerrar aria-label="Cerrar">×</button></div>
    <div class="dlg-body">
      ${!p && proyectos?.length ? `<div class="campo"><label>Partir de un proyecto de cliente (opcional)</label>
        <select id="pBase"><option value="">— Ninguno —</option>${proyectos.map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</select></div>` : ''}
      <div class="campo"><label>Título *</label><input id="pTit" required maxlength="120" value="${esc(p?.titulo || '')}"></div>
      <div class="campo"><label>Descripción (español) *</label><textarea id="pDes_es" required maxlength="600">${esc(p?.descripcion?.es || '')}</textarea></div>
      <details class="campo"><summary class="mono" style="font-size:12.5px;cursor:pointer">Traducciones (opcional · si faltan se muestra el español)</summary>
        ${IDIOMAS_WEB.slice(1).map(([l, n]) => `<div class="campo" style="margin-top:10px"><label>${n}</label><textarea id="pDes_${l}" maxlength="600">${esc(p?.descripcion?.[l] || '')}</textarea></div>`).join('')}
      </details>
      <div class="campo"><label>Enlace a la web del proyecto</label><input id="pUrl" type="url" placeholder="https://…" value="${esc(p?.url || '')}"></div>
      <div class="campo"><label>Etiquetas (separadas por comas)</label><input id="pEti" placeholder="Diseño a medida, Reservas, SEO" value="${esc((p?.etiquetas || []).join(', '))}"></div>
      <div class="campo"><label>Captura de la web</label>
        <div class="port-prev" id="pPrev">${p?.imagen ? `<img src="${esc(imgWeb(p.imagen))}" alt="">` : '<span class="muted" style="font-size:12.5px">Sin imagen · mejor horizontal (ordenador)</span>'}</div>
        <input id="pImg" type="file" accept="image/*" style="margin-top:8px"></div>
      <label style="display:flex;gap:8px;align-items:center;font-family:'IBM Plex Sans';text-transform:none;letter-spacing:0;font-size:13.5px"><input type="checkbox" id="pPub" style="width:auto" ${p ? (p.publicado ? 'checked' : '') : 'checked'}> Publicar en la web</label>
      <p class="error" id="pErr"></p>
    </div>
    <div class="dlg-foot"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button type="submit" class="btn solid">Guardar</button></div>
  </form>`;
  document.body.appendChild(d);
  const $ = (id) => d.querySelector('#' + id);
  const cerrarD = () => { d.close(); d.remove(); };
  d.querySelectorAll('[data-cerrar]').forEach((b) => (b.onclick = cerrarD));
  let archivo = null;
  $('pImg').onchange = () => {
    archivo = $('pImg').files[0] || null;
    if (archivo) $('pPrev').innerHTML = `<img src="${URL.createObjectURL(archivo)}" alt="">`;
  };
  if ($('pBase')) $('pBase').onchange = () => {
    const x = proyectos.find((y) => y.id === $('pBase').value); if (!x) return;
    if (!$('pTit').value) $('pTit').value = x.nombre;
    if (!$('pUrl').value && x.url_preview) $('pUrl').value = x.url_preview;
    if (!$('pDes_es').value && x.descripcion) $('pDes_es').value = x.descripcion;
  };
  $('fPort').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = e.target.querySelector('[type=submit]'); b.disabled = true; $('pErr').textContent = '';
    try {
      let imagen = p?.imagen || null;
      if (archivo) {
        const blob = await prepararImagen(archivo);
        const ruta = `${crypto.randomUUID()}.webp`;
        const up = await sb.storage.from('portfolio').upload(ruta, blob, { contentType: blob.type || 'image/webp', cacheControl: '31536000' });
        if (up.error) throw up.error;
        const viejo = rutaStorage(imagen); if (viejo) sb.storage.from('portfolio').remove([viejo]);
        imagen = sb.storage.from('portfolio').getPublicUrl(ruta).data.publicUrl;
      }
      const descripcion = {};
      IDIOMAS_WEB.forEach(([l]) => { const v = $('pDes_' + l).value.trim(); if (v) descripcion[l] = v; });
      const fila = {
        titulo: $('pTit').value.trim(), descripcion, imagen, publicado: $('pPub').checked,
        url: $('pUrl').value.trim() || null,
        etiquetas: $('pEti').value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6),
      };
      if (!p && $('pBase')?.value) fila.proyecto_id = $('pBase').value;
      const { error } = p ? await sb.from('portfolio').update(fila).eq('id', p.id)
                          : await sb.from('portfolio').insert({ ...fila, orden: total + 1 });
      if (error) throw error;
      toast(fila.publicado ? 'Guardado y publicado en la web' : 'Guardado (oculto en la web)');
      cerrarD(); vWeb();
    } catch (err) {
      console.error(err); $('pErr').textContent = 'No se ha podido guardar: ' + (err.message || err); b.disabled = false;
    }
  });
  d.showModal();
}


  return { vWeb };
}
