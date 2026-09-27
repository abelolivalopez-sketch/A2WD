// =====================================================================
//  Edge Function: invitar-cliente
//  Envía el correo de invitación al portal. Solo la pueden usar creadores.
//  La clave secreta (service_role) vive aquí, en el servidor de Supabase,
//  nunca en la web.
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. ¿Quién llama? Debe ser un creador con sesión iniciada.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: 'Sesión no válida' }, 401);

  const { data: perfil } = await admin.from('perfiles').select('rol').eq('id', userData.user.id).single();
  if (perfil?.rol !== 'creador') return json({ error: 'Solo los creadores pueden invitar' }, 403);

  // 2. Datos de la invitación
  const { email, redirectTo } = await req.json().catch(() => ({}));
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Correo no válido' }, 400);

  // 3. Enviar invitación (si ya existe la cuenta, se avisa)
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), { redirectTo });
  if (error) {
    const yaExiste = /already|registered|exists/i.test(error.message);
    return json({ error: yaExiste ? 'Este correo ya tiene cuenta en el portal' : error.message }, 400);
  }
  return json({ ok: true });
});
