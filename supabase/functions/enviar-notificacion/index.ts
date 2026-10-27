// =====================================================================
//  Edge Function: enviar-notificacion
//  La llama la base de datos (privado.notificar) al crear un mensaje, un
//  avance o un mensaje del formulario de la web, o al cambiar la fase/progreso
//  de un proyecto. Envía un aviso Web Push a los móviles del cliente o de los
//  creadores, en su idioma. Los mensajes de la web llegan además por correo
//  (Resend, clave RESEND_API_KEY).
//  Protegida con la cabecera x-a2wd-secreto (NOTIF_SECRET en privado.ajustes).
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Idioma = 'es' | 'fr' | 'it' | 'en';
const FASES: Record<Idioma, Record<string, string>> = {
  es: { diseno: 'Diseño', desarrollo: 'Desarrollo', revision: 'Revisión', entregado: 'Entregado' },
  fr: { diseno: 'Design', desarrollo: 'Développement', revision: 'Révision', entregado: 'Livré' },
  it: { diseno: 'Design', desarrollo: 'Sviluppo', revision: 'Revisione', entregado: 'Consegnato' },
  en: { diseno: 'Design', desarrollo: 'Development', revision: 'Review', entregado: 'Delivered' },
};
const TXT: Record<Idioma, Record<string, string>> = {
  es: { msg: 'Nuevo mensaje de A2WD', avance: 'Nuevo avance en tu web', fase: 'Tu proyecto avanza', ahora: 'Fase: {f} · {p}% completado' },
  fr: { msg: 'Nouveau message d’A2WD', avance: 'Nouvelle avancée sur votre site', fase: 'Votre projet avance', ahora: 'Étape : {f} · {p} % terminé' },
  it: { msg: 'Nuovo messaggio da A2WD', avance: 'Nuovo avanzamento del tuo sito', fase: 'Il tuo progetto avanza', ahora: 'Fase: {f} · {p}% completato' },
  en: { msg: 'New message from A2WD', avance: 'New update on your website', fase: 'Your project is moving', ahora: 'Stage: {f} · {p}% complete' },
};
const recorta = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const idioma = (s: string): Idioma => (['es', 'fr', 'it', 'en'].includes(s) ? s as Idioma : 'es');
const NOMBRE_IDIOMA: Record<Idioma, string> = { es: 'Español', fr: 'Francés', it: 'Italiano', en: 'Inglés' };
const PANEL = 'https://a2wdstudio.com/portal/creador';
const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const unaLinea = (s: string) => s.replace(/\s+/g, ' ').trim();

type MensajeWeb = { id: string; nombre: string; email: string; asunto: string; mensaje: string; idioma: string; pagina: string; created_at: string };

function correoMensajeWeb(m: MensajeWeb) {
  const fecha = new Date(m.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'full', timeStyle: 'short' });
  const filas: [string, string][] = [
    ['Nombre', m.nombre], ['Correo', m.email], ['Asunto', m.asunto || '—'],
    ['Idioma', NOMBRE_IDIOMA[idioma(m.idioma)]], ['Página', m.pagina || '/'], ['Fecha', fecha],
  ];
  const enlace = `${PANEL}#buzon/${m.id}`;
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p style="margin:0 0 14px">Nuevo mensaje desde el formulario de a2wdstudio.com. Pulsa <b>Responder</b> para contestar a ${escHtml(m.nombre)}.</p>
<table cellpadding="6" style="border-collapse:collapse;font-size:14px">${filas.map(([k, v]) => `<tr><td style="color:#667;padding-right:14px">${k}</td><td>${escHtml(v)}</td></tr>`).join('')}</table>
<div style="margin:16px 0;padding:14px 16px;border-left:3px solid #9cc0ff;background:#f4f7ff;white-space:pre-wrap">${escHtml(m.mensaje)}</div>
<p style="margin:0;color:#667;font-size:13px">También está en el panel: <a href="${enlace}">${enlace}</a></p>
</div>`;
  const text = `Nuevo mensaje desde el formulario de a2wdstudio.com\n\n${filas.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${m.mensaje}\n\nPanel: ${enlace}`;
  return { subject: recorta(unaLinea(`Web · ${m.asunto || 'Nuevo mensaje'} · ${m.nombre}`), 160), html, text };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const ajuste = async (k: string) => Deno.env.get(k) || (await admin.rpc('ajuste_privado', { p_clave: k })).data as string | null;

  const secreto = await ajuste('NOTIF_SECRET');
  if (!secreto || req.headers.get('x-a2wd-secreto') !== secreto) return json({ error: 'No autorizado' }, 401);

  const [pub, priv, subject] = await Promise.all([ajuste('VAPID_PUBLIC_KEY'), ajuste('VAPID_PRIVATE_KEY'), ajuste('VAPID_SUBJECT')]);
  if (!pub || !priv) return json({ error: 'Faltan claves VAPID' }, 500);
  webpush.setVapidDetails(subject || 'mailto:info@a2wdstudio.com', pub, priv);

  const { tabla, id } = await req.json().catch(() => ({}));
  if (!tabla || !id) return json({ error: 'Falta tabla o id' }, 400);

  // Destinatarios y contenido (por idioma)
  let destinatarios: string[] = [];
  let crear: (l: Idioma) => { title: string; body: string };
  let url = 'portal/cliente.html';
  let etiqueta = '';

  const usuarioCliente = async (proyectoId: string) => {
    const { data } = await admin.from('proyectos').select('nombre, clientes(user_id)').eq('id', proyectoId).single();
    // deno-lint-ignore no-explicit-any
    const uid = (data as any)?.clientes?.user_id as string | undefined;
    return { nombre: data?.nombre as string ?? '', uid };
  };

  if (tabla === 'comentarios') {
    const { data: c } = await admin.from('comentarios').select('proyecto_id, cliente_id, autor_id, autor_nombre, autor_rol, mensaje').eq('id', id).single();
    if (!c) return json({ ok: true, enviados: 0 });
    const { data: cl } = await admin.from('clientes').select('nombre, empresa, user_id').eq('id', c.cliente_id).single();
    const nombreProy = c.proyecto_id ? (await admin.from('proyectos').select('nombre').eq('id', c.proyecto_id).single()).data?.nombre : null;
    etiqueta = 'chat-' + c.cliente_id;
    if (c.autor_rol === 'creador') {
      destinatarios = cl?.user_id ? [cl.user_id] : [];
      crear = (l) => ({ title: TXT[l].msg, body: recorta(`${c.autor_nombre ? c.autor_nombre + ': ' : ''}${c.mensaje}`) });
    } else {
      const { data: creadores } = await admin.from('perfiles').select('id').eq('rol', 'creador');
      destinatarios = (creadores ?? []).map((p) => p.id).filter((x) => x !== c.autor_id);
      url = 'portal/creador.html#mensajes/' + c.cliente_id;
      crear = () => ({ title: `💬 ${c.autor_nombre || cl?.nombre || 'Cliente'}${nombreProy ? ' · ' + nombreProy : ''}`, body: recorta(c.mensaje) });
    }
  } else if (tabla === 'avances') {
    const { data: a } = await admin.from('avances').select('proyecto_id, titulo').eq('id', id).single();
    if (!a) return json({ ok: true, enviados: 0 });
    const { nombre, uid } = await usuarioCliente(a.proyecto_id);
    destinatarios = uid ? [uid] : [];
    etiqueta = 'avance-' + a.proyecto_id;
    crear = (l) => ({ title: TXT[l].avance, body: recorta(`${nombre}: ${a.titulo}`) });
  } else if (tabla === 'proyectos') {
    const { data: p } = await admin.from('proyectos').select('nombre, estado, progreso, clientes(user_id)').eq('id', id).single();
    if (!p) return json({ ok: true, enviados: 0 });
    // deno-lint-ignore no-explicit-any
    const uid = (p as any).clientes?.user_id as string | undefined;
    destinatarios = uid ? [uid] : [];
    etiqueta = 'estado-' + id;
    crear = (l) => ({ title: `${TXT[l].fase} · ${p.nombre}`, body: TXT[l].ahora.replace('{f}', FASES[l][p.estado] ?? p.estado).replace('{p}', String(p.progreso)) });
  } else if (tabla === 'equipo_mensajes') {
    // Chat interno del equipo: avisa al resto de creadores
    const { data: m } = await admin.from('equipo_mensajes').select('autor_id, autor_nombre, proyecto_id, mensaje, proyectos(nombre)').eq('id', id).single();
    if (!m) return json({ ok: true, enviados: 0 });
    const { data: creadores } = await admin.from('perfiles').select('id').eq('rol', 'creador');
    destinatarios = (creadores ?? []).map((p) => p.id).filter((x) => x !== m.autor_id);
    // deno-lint-ignore no-explicit-any
    const canal = (m as any).proyectos?.nombre as string | undefined;
    url = 'portal/creador.html#equipo' + (m.proyecto_id ? '/' + m.proyecto_id : '');
    etiqueta = 'equipo-' + (m.proyecto_id || 'general');
    crear = () => ({ title: `👥 ${m.autor_nombre || 'Equipo'} · ${canal || 'General'}`, body: recorta(m.mensaje) });
  } else if (tabla === 'mensajes_web') {
    const { data: m } = await admin.from('mensajes_web').select('id, nombre, email, asunto, mensaje, idioma, pagina, created_at').eq('id', id).single();
    if (!m) return json({ ok: true, enviados: 0 });
    const clave = await ajuste('RESEND_API_KEY');
    let errorCorreo: string | null = 'Falta RESEND_API_KEY';
    if (clave) {
      const [de, para] = await Promise.all([ajuste('CORREO_REMITENTE'), ajuste('CORREO_DESTINO')]);
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: de || 'Formulario A2WD <info@a2wdstudio.com>', to: [para || 'info@a2wdstudio.com'], reply_to: m.email, ...correoMensajeWeb(m as MensajeWeb) }),
        });
        errorCorreo = r.ok ? null : `Resend ${r.status}: ${(await r.text()).slice(0, 300)}`;
      } catch (e) {
        errorCorreo = `Resend: ${(e as Error).message}`.slice(0, 300);
      }
    }
    await admin.from('mensajes_web')
      .update(errorCorreo ? { correo_error: errorCorreo } : { correo_enviado_en: new Date().toISOString(), correo_error: null })
      .eq('id', id);
    const { data: creadores } = await admin.from('perfiles').select('id').eq('rol', 'creador');
    destinatarios = (creadores ?? []).map((p) => p.id);
    url = 'portal/creador.html#buzon/' + id;
    etiqueta = 'web-' + id;
    crear = () => ({ title: `✉️ ${m.nombre} · web`, body: recorta(m.asunto ? `${m.asunto} · ${m.mensaje}` : m.mensaje) });
  } else {
    return json({ error: 'Tabla no admitida' }, 400);
  }

  if (!destinatarios.length) return json({ ok: true, enviados: 0 });
  const { data: subs } = await admin.from('push_suscripciones').select('id, endpoint, p256dh, auth, idioma').in('usuario_id', destinatarios);

  let enviados = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    const contenido = crear(idioma(s.idioma));
    const carga = JSON.stringify({ ...contenido, url, tag: etiqueta });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 86400, urgency: 'high' });
      enviados++;
    } catch (e) {
      // El móvil ya no acepta avisos (app borrada, permiso retirado): se limpia
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await admin.from('push_suscripciones').delete().eq('id', s.id);
      else console.error('push', code, (e as Error).message);
    }
  }));
  return json({ ok: true, enviados });
});
