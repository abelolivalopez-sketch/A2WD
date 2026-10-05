// =====================================================================
//  AJUSTES del panel de creador
//  Cuenta (nombre, contraseña, sesiones), avisos, preferencias de este
//  dispositivo, la app y exportar datos. Las preferencias del panel se
//  guardan solo en este navegador (localStorage).
// =====================================================================
const PREF = { inicio: 'a2wd_inicio', estrellas: 'a2wd_estrellas', quieto: 'a2wd_quieto' };
const leer = (k, def) => { try { return localStorage.getItem(k) ?? def; } catch { return def; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

/** Aplica al abrir el panel las preferencias guardadas en este dispositivo */
export function aplicarPreferencias() {
  document.documentElement.classList.toggle('sin-estrellas', leer(PREF.estrellas, '1') === '0');
  document.documentElement.classList.toggle('quieto', leer(PREF.quieto, '0') === '1');
}

export function crearAjustes({ sb, vista, perfil, esc, toast, fallo, salir, botonAvisos, activarCambioPassword, pintarPerfil }) {
  const INICIOS = [['resumen', 'Resumen'], ['mensajes', 'Mensajes'], ['proyectos', 'Proyectos'], ['clientes', 'Clientes'], ['facturas', 'Facturas'], ['equipo', 'Equipo']];
  const interruptor = (id, on, etiqueta) =>
    `<label class="interruptor"><input type="checkbox" role="switch" id="${id}" ${on ? 'checked' : ''} aria-label="${esc(etiqueta)}"><span aria-hidden="true"></span></label>`;
  const fila = (titulo, texto, control) =>
    `<div class="aj-fila"><div><h3>${titulo}</h3>${texto ? `<p class="muted">${texto}</p>` : ''}</div><div class="aj-ctrl">${control}</div></div>`;

  async function vAjustes() {
    const instalada = !!window.A2WDApp?.instalada;
    vista.innerHTML = `
      <div class="cabecera"><div><h1>Ajustes</h1><p class="muted" style="margin-top:8px">Tu cuenta, los avisos y cómo se ve el panel en este dispositivo.</p></div></div>
      <div class="aj">
        <nav class="aj-indice" aria-label="Apartados de ajustes">
          ${[['perfil', 'Perfil'], ['seguridad', 'Seguridad'], ['avisos', 'Avisos'], ['panel', 'Panel'], ['app', 'App'], ['datos', 'Datos']]
            .map(([k, l]) => `<button type="button" data-ir="aj-${k}">${l}</button>`).join('')}
        </nav>
        <div class="aj-secciones">
          <section class="card" id="aj-perfil" aria-labelledby="ajTPerfil">
            <h2 id="ajTPerfil">Perfil</h2>
            <form id="fPerfil" class="aj-perfil">
              <span class="avatar avatar-g" id="ajAvatar" aria-hidden="true"></span>
              <div class="aj-campos">
                <div class="campo"><label for="ajNombre">Nombre visible</label><input id="ajNombre" maxlength="60" required value="${esc(perfil.nombre || '')}"></div>
                <div class="campo"><label for="ajCorreo">Correo de acceso</label><input id="ajCorreo" value="${esc(perfil.email)}" readonly aria-describedby="ajCorreoAyuda"><p class="muted aj-ayuda" id="ajCorreoAyuda">Es tu usuario para entrar. Lo ven los clientes cuando les respondes.</p></div>
                <button class="btn solid" type="submit">Guardar nombre</button>
              </div>
            </form>
          </section>

          <section class="card" id="aj-seguridad" aria-labelledby="ajTSeg">
            <h2 id="ajTSeg">Seguridad</h2>
            ${fila('Contraseña', 'Cámbiala si crees que alguien más la conoce. Mínimo 8 caracteres.', '<button class="btn" type="button" id="cambiarPw">Cambiar contraseña</button>')}
            ${fila('Sesiones abiertas', 'Cierra el panel en todos los móviles y ordenadores donde hayas entrado, incluido este.', '<button class="btn danger" type="button" id="salirTodo">Cerrar todas las sesiones</button>')}
          </section>

          <section class="card" id="aj-avisos" aria-labelledby="ajTAv">
            <h2 id="ajTAv">Avisos</h2>
            ${fila('Este dispositivo', 'Recibe un aviso cuando un cliente o tu socio te escriben.', '<span id="ajAvisos"></span>')}
            ${fila('Dispositivos con avisos', 'Móviles y ordenadores donde tienes los avisos activados.', '<b class="aj-num" id="ajDispositivos">…</b>')}
          </section>

          <section class="card" id="aj-panel" aria-labelledby="ajTPanel">
            <h2 id="ajTPanel">Panel</h2>
            <p class="muted aj-sub">Solo para este navegador.</p>
            ${fila('Pantalla al abrir', 'Lo primero que ves al entrar en el panel.', `<select id="ajInicio" aria-label="Pantalla al abrir">${INICIOS.map(([v, l]) => `<option value="${v}" ${leer(PREF.inicio, 'resumen') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
            ${fila('Fondo de estrellas', 'Quítalo si prefieres un fondo liso.', interruptor('ajEstrellas', leer(PREF.estrellas, '1') !== '0', 'Fondo de estrellas'))}
            ${fila('Reducir animaciones', 'Quita transiciones y movimientos del panel.', interruptor('ajQuieto', leer(PREF.quieto, '0') === '1', 'Reducir animaciones'))}
          </section>

          <section class="card" id="aj-app" aria-labelledby="ajTApp">
            <h2 id="ajTApp">App</h2>
            ${fila('Instalar en este dispositivo', instalada ? 'Ya la tienes instalada: ábrela desde el icono de A2WD.' : 'Un icono en la pantalla de inicio que abre el panel directamente.',
              instalada ? '<span class="tag ok">Instalada</span>' : '<button class="btn" type="button" id="ajInstalar"><span class="i i-movil" aria-hidden="true"></span>Instalar la app</button>')}
            ${fila('Versión del portal', 'Si un compañero ve algo distinto, comparad este número.', '<code id="ajVersion">…</code>')}
          </section>

          <section class="card" id="aj-datos" aria-labelledby="ajTDatos">
            <h2 id="ajTDatos">Datos</h2>
            ${fila('Clientes', 'Nombre, empresa, contacto, NIF y estado. Se abre en Excel o Google Sheets.', '<button class="btn" type="button" data-exportar="clientes"><span class="i i-descargar" aria-hidden="true"></span>Descargar CSV</button>')}
            ${fila('Facturas y presupuestos', 'Con base, IVA y total. Útil para la gestoría o como copia de seguridad.', '<button class="btn" type="button" data-exportar="facturas"><span class="i i-descargar" aria-hidden="true"></span>Descargar CSV</button>')}
          </section>
        </div>
      </div>`;

    // Índice: lleva a cada apartado sin cambiar la dirección
    vista.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => document.getElementById(b.dataset.ir).scrollIntoView({ behavior: 'smooth', block: 'start' })));

    // Perfil
    const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
    const av = document.getElementById('ajAvatar');
    const nom = document.getElementById('ajNombre');
    av.textContent = iniciales(perfil.nombre || perfil.email);
    nom.addEventListener('input', () => { av.textContent = iniciales(nom.value || perfil.email); });
    document.getElementById('fPerfil').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = nom.value.trim(); if (!nombre) return;
      const b = e.target.querySelector('[type=submit]'); b.disabled = true;
      const { error } = await sb.from('perfiles').update({ nombre }).eq('id', perfil.id);
      b.disabled = false;
      if (fallo(error, 'No se pudo guardar el nombre')) return;
      perfil.nombre = nombre; pintarPerfil(nombre); toast('Nombre guardado');
    });

    // Seguridad
    activarCambioPassword(document.getElementById('cambiarPw'));
    document.getElementById('salirTodo').addEventListener('click', async (e) => {
      if (!confirm('Se cerrará el panel en todos tus dispositivos y tendrás que volver a entrar. ¿Continuar?')) return;
      e.currentTarget.disabled = true;
      try { await sb.auth.signOut({ scope: 'global' }); } catch {}
      salir();
    });

    // Avisos
    botonAvisos(document.getElementById('ajAvisos'), sb);
    sb.from('push_suscripciones').select('id', { count: 'exact', head: true }).eq('usuario_id', perfil.id)
      .then(({ count, error }) => { document.getElementById('ajDispositivos').textContent = error ? '—' : String(count ?? 0); });

    // Panel
    document.getElementById('ajInicio').addEventListener('change', (e) => { guardar(PREF.inicio, e.target.value); toast('Guardado: el panel se abrirá en ' + e.target.selectedOptions[0].textContent); });
    document.getElementById('ajEstrellas').addEventListener('change', (e) => { guardar(PREF.estrellas, e.target.checked ? '1' : '0'); aplicarPreferencias(); });
    document.getElementById('ajQuieto').addEventListener('change', (e) => { guardar(PREF.quieto, e.target.checked ? '1' : '0'); aplicarPreferencias(); });

    // App
    document.getElementById('ajInstalar')?.addEventListener('click', () => window.A2WDApp?.instalar());
    fetch('../sw.js', { cache: 'no-cache' }).then((r) => r.text())
      .then((t) => { document.getElementById('ajVersion').textContent = (t.match(/VERSION\s*=\s*'([^']+)'/) || [])[1] || '—'; })
      .catch(() => { document.getElementById('ajVersion').textContent = '—'; });

    // Datos
    vista.querySelectorAll('[data-exportar]').forEach((b) => b.addEventListener('click', () => exportar(b.dataset.exportar, b)));
  }

  // ---------- Exportar a CSV (separado por «;» y con BOM para que Excel en español lo abra bien) ----------
  const celda = (v) => {
    if (v == null) return '';
    const s = typeof v === 'number' ? v.toLocaleString('es-ES', { useGrouping: false, maximumFractionDigits: 2 }) : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  async function exportar(que, boton) {
    boton.disabled = true;
    let filas, cab, nombre;
    if (que === 'clientes') {
      const { data, error } = await sb.from('clientes').select('*').order('nombre');
      boton.disabled = false;
      if (fallo(error, 'No se pudo exportar')) return;
      cab = ['Nombre', 'Empresa', 'Correo', 'Teléfono', 'NIF', 'Dirección', 'Servicios', 'Estado', 'Alta'];
      filas = (data || []).map((c) => [c.nombre, c.empresa, c.email, c.telefono, c.nif, c.direccion, c.servicios, c.estado, c.created_at?.slice(0, 10)]);
      nombre = 'clientes';
    } else {
      const { data, error } = await sb.from('facturas').select('*, clientes(nombre,empresa,nif)').order('fecha_emision');
      boton.disabled = false;
      if (fallo(error, 'No se pudo exportar')) return;
      cab = ['Tipo', 'Número', 'Fecha', 'Vencimiento', 'Cliente', 'NIF', 'Concepto', 'Base', 'IVA %', 'IVA', 'Total', 'Estado'];
      filas = (data || []).map((f) => [f.tipo, f.numero, f.fecha_emision, f.fecha_vencimiento, f.clientes?.empresa || f.clientes?.nombre, f.clientes?.nif,
        f.concepto, Number(f.base), Number(f.iva_pct), Math.round((Number(f.total) - Number(f.base)) * 100) / 100, Number(f.total), f.estado]);
      nombre = 'facturas';
    }
    const csv = '﻿' + [cab, ...filas].map((r) => r.map(celda).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `a2wd-${nombre}-${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(`Descargado: ${filas.length} ${que === 'clientes' ? 'clientes' : 'documentos'}`);
  }

  return { vAjustes };
}
