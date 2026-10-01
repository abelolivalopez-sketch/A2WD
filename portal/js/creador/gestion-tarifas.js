// Tarifas, calculadora comercial y notas internas.
export function crearGestionTarifas({
  vista, esc, euros, toast, abrirForm, camposFactura, guardarEn,
}) {
// =================== TARIFAS · chuleta para hablar con clientes ===================
// Precios: ../tarifas.js (los mismos que ve la web). Notas internas: tabla «chuleta».
async function vTarifas() {
  const T = window.A2WD_TARIFAS;
  if (!T) { vista.innerHTML = '<div class="vacio">No se han podido cargar las tarifas.</div>'; return; }
  const P = (n) => window.A2WD_precio(n, 'es');
  const { data: nota } = await sb.from('chuleta').select('*').eq('clave', 'notas').maybeSingle();
  vista.innerHTML = `
    <div class="cabecera"><div><p class="eyebrow">Chuleta del equipo</p><h1>Tarifas</h1>
      <p class="muted" style="margin-top:6px;font-size:13.5px">Precios sin IVA · los mismos que ve el cliente en la web · actualizado ${fecha(T.actualizado)}</p></div></div>

    <div class="tarifas-grid">
      ${T.paquetes.map((p) => `
        <div class="card tarifa ${p.destacado ? 'dest' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
            <h3>${esc(p.nombre.es)}</h3>${p.destacado ? '<span class="tag dark">Recomendado</span>' : ''}</div>
          <p class="cifra">${p.desde ? '<small>desde</small>' : ''}${P(p.precio)}</p>
          <p class="muted" style="font-size:13px">${esc(p.para.es)}</p>
          <ul>${p.incluye.es.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          <p class="mono muted" style="font-size:12px">Plazo · ${esc(p.plazo.es)}</p>
        </div>`).join('')}
    </div>

    <div class="tarifas-2">
      <div class="card"><p class="eyebrow">Mantenimiento</p>
        ${T.mantenimiento.map((m) => `<div class="fila-t"><span>${esc(m.nombre.es)}<small>${esc(m.incluye.es.join(' · '))}</small></span><b>${P(m.precio)}/mes</b></div>`).join('')}</div>
      <div class="card"><p class="eyebrow">Extras</p>
        ${T.extras.map((x) => `<div class="fila-t"><span>${esc(x.nombre.es)}</span><b>+${P(x.precio)} <small style="display:inline">${esc(x.unidad.es)}</small></b></div>`).join('')}</div>
    </div>

    <div class="card" style="margin-top:22px">
      <p class="eyebrow">Calculadora rápida</p>
      <div class="calc">
        <div class="stack">
          <div class="campo"><label>Paquete</label><select id="cPaq">${T.paquetes.map((p) => `<option value="${p.id}" ${p.destacado ? 'selected' : ''}>${esc(p.nombre.es)} · ${P(p.precio)}</option>`).join('')}</select></div>
          ${T.extras.map((x) => `<div class="fila-x"><label style="text-transform:none;letter-spacing:0;font-size:13px">${esc(x.nombre.es)} <span class="muted">+${P(x.precio)}</span></label>
            <input type="number" min="0" max="20" value="0" data-extra="${x.id}" aria-label="${esc(x.nombre.es)}"></div>`).join('')}
          <div class="fila">
            <div class="campo"><label>Mantenimiento</label><select id="cMant"><option value="">Sin mantenimiento</option>${T.mantenimiento.map((m, i) => `<option value="${m.id}" ${i === 0 ? 'selected' : ''}>${esc(m.nombre.es)} · ${P(m.precio)}/mes</option>`).join('')}</select></div>
            <div class="campo"><label>IVA</label><select id="cIva"><option value="21">España 21 %</option><option value="20">Francia 20 %</option><option value="0">Sin IVA</option></select></div>
          </div>
          <div class="campo"><label>Descuento (%)</label><input id="cDto" type="number" min="0" max="100" value="0" style="max-width:140px"></div>
          <label class="porta"><input type="checkbox" id="cPorta"> <span><b>Cliente portafolio</b> · descuento 100 % a cambio de testimonio, reseña y permiso para enseñar su web</span></label>
        </div>
        <div class="resumen-calc" id="cRes"></div>
      </div>
    </div>

    <div class="card" style="margin-top:22px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <p class="eyebrow" style="margin:0">Notas internas (solo creadores)</p>
        <span class="muted mono" style="font-size:11.5px">${nota ? 'Última edición: ' + fecha(nota.updated_at, true) + (nota.updated_por ? ' · ' + esc(nota.updated_por) : '') : ''}</span></div>
      <textarea id="notas" style="min-height:360px;margin-top:12px;font-size:13.5px;line-height:1.6">${esc(nota?.contenido || '')}</textarea>
      <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn solid" id="gNotas">Guardar notas</button></div>
    </div>`;

  // ---- Calculadora ----
  const $ = (id) => document.getElementById(id);
  let ultimo = null;
  const calcular = () => {
    const paq = T.paquetes.find((p) => p.id === $('cPaq').value);
    const lineas = [[paq.nombre.es, paq.precio]];
    vista.querySelectorAll('[data-extra]').forEach((i) => {
      const n = Math.max(0, parseInt(i.value, 10) || 0);
      if (n) { const x = T.extras.find((e) => e.id === i.dataset.extra); lineas.push([`${x.nombre.es}${n > 1 ? ' ×' + n : ''}`, x.precio * n]); }
    });
    const bruto = lineas.reduce((s, l) => s + l[1], 0);
    const pct = $('cPorta').checked ? 100 : Math.min(100, Math.max(0, Number($('cDto').value) || 0));
    const dto = Math.round(bruto * pct) / 100;
    const base = bruto - dto, iva = Number($('cIva').value), total = base * (1 + iva / 100);
    const mant = T.mantenimiento.find((m) => m.id === $('cMant').value);
    ultimo = { paq, lineas, pct, base, iva, mant };
    $('cRes').innerHTML = `
      ${lineas.map((l) => `<div class="fila-t"><span>${esc(l[0])}</span><b>${euros(l[1])}</b></div>`).join('')}
      ${pct ? `<div class="fila-t"><span>${$('cPorta').checked ? 'Descuento portafolio' : 'Descuento'} (-${pct} %)</span><b>-${euros(dto)}</b></div>` : ''}
      <div class="fila-t"><span>Base imponible</span><b>${euros(base)}</b></div>
      <div class="fila-t"><span>IVA ${iva} %</span><b>${euros(base * iva / 100)}</b></div>
      <div class="fila-t total"><span>Total web</span><b>${euros(total)}</b></div>
      ${mant ? `<div class="fila-t"><span>${esc(mant.nombre.es)}</span><b>${euros(mant.precio * (1 + iva / 100))}/mes</b></div>` : ''}
      ${pct < 100 ? `<p class="muted" style="font-size:12.5px;margin-top:8px">Pago: 50 % al aceptar (${euros(total / 2)}) y 50 % al publicar.</p>` : `<p class="muted" style="font-size:12.5px;margin-top:8px">Precio real ${euros(bruto)} · a cambio de testimonio, reseña y permiso para enseñarla.</p>`}
      <button class="btn solid" id="gPresu" style="width:100%;margin-top:14px">Guardar como presupuesto</button>`;
    $('gPresu').onclick = async () => {
      const u = ultimo;
      const concepto = `Web ${u.paq.nombre.es}` + (u.lineas.length > 1 ? ' + ' + u.lineas.slice(1).map((l) => l[0]).join(', ') : '') + (u.pct ? ` (dto. ${u.pct} %${u.pct === 100 ? ' portafolio' : ''})` : '') + (u.mant ? ` · ${u.mant.nombre.es} ${P(u.mant.precio)}/mes` : '');
      abrirForm({ titulo: 'Nuevo presupuesto', campos: await camposFactura(),
        valores: { tipo: 'presupuesto', concepto, base: u.base.toFixed(2), iva_pct: u.iva, estado: 'borrador' },
        guardar: guardarEn('facturas') });
    };
  };
  vista.querySelectorAll('#cPaq,#cMant,#cIva,#cDto,#cPorta,[data-extra]').forEach((el) => (el.oninput = el.onchange = calcular));
  calcular();

  // ---- Notas ----
  $('gNotas').onclick = async () => {
    const { error } = await sb.from('chuleta').upsert({ clave: 'notas', contenido: $('notas').value, updated_at: new Date().toISOString(), updated_por: perfil.nombre || perfil.email });
    if (!fallo(error, 'No se han guardado las notas')) toast('Notas guardadas');
  };
}


  return { vTarifas };
}
