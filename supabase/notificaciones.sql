-- =====================================================================
--  Notificaciones en el móvil (Web Push) · A2WD
--  - Cada móvil/navegador que activa avisos guarda aquí su suscripción.
--  - Al crear un mensaje o avance, o al cambiar la fase/progreso de un
--    proyecto, la base de datos llama a la función enviar-notificacion.
--  Claves necesarias en privado.ajustes (NO en GitHub):
--    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, NOTIF_SECRET
-- =====================================================================

create extension if not exists pg_net;

create table if not exists public.push_suscripciones (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  idioma      text not null default 'es' check (idioma in ('es','fr','it','en')),
  created_at  timestamptz not null default now()
);
create index if not exists push_suscripciones_usuario on public.push_suscripciones (usuario_id);

alter table public.push_suscripciones enable row level security;
drop policy if exists push_ver on public.push_suscripciones;
create policy push_ver on public.push_suscripciones for select to authenticated
  using (usuario_id = (select auth.uid()));
-- Altas y bajas solo a través de las funciones de abajo
revoke insert, update, delete on public.push_suscripciones from anon, authenticated;

-- Registrar este dispositivo para el usuario conectado (si el móvil
-- lo usaba otra persona, pasa a ser del usuario actual)
create or replace function public.registrar_push(p_endpoint text, p_p256dh text, p_auth text, p_idioma text default 'es')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into public.push_suscripciones (usuario_id, endpoint, p256dh, auth, idioma)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth,
          case when p_idioma in ('es','fr','it','en') then p_idioma else 'es' end)
  on conflict (endpoint) do update
    set usuario_id = excluded.usuario_id, p256dh = excluded.p256dh,
        auth = excluded.auth, idioma = excluded.idioma;
end $$;

create or replace function public.quitar_push(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_suscripciones where endpoint = p_endpoint and usuario_id = auth.uid();
$$;

revoke execute on function public.registrar_push(text, text, text, text) from public, anon;
revoke execute on function public.quitar_push(text) from public, anon;
grant  execute on function public.registrar_push(text, text, text, text) to authenticated;
grant  execute on function public.quitar_push(text) to authenticated;

-- Llama a la Edge Function en segundo plano (no retrasa el guardado)
create or replace function privado.notificar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_secreto text;
begin
  select valor into v_secreto from privado.ajustes where clave = 'NOTIF_SECRET';
  if v_secreto is null then return new; end if;
  if tg_table_name = 'proyectos'
     and new.estado is not distinct from old.estado
     and new.progreso is not distinct from old.progreso then
    return new;
  end if;
  perform net.http_post(
    url     := 'https://vsqxcxmsvsektvsceqpx.supabase.co/functions/v1/enviar-notificacion',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-a2wd-secreto', v_secreto),
    body    := jsonb_build_object('tabla', tg_table_name, 'id', new.id)
  );
  return new;
exception when others then
  return new;  -- un fallo al avisar nunca debe impedir guardar
end $$;
revoke execute on function privado.notificar() from public, anon, authenticated;

drop trigger if exists comentarios_notificar on public.comentarios;
create trigger comentarios_notificar after insert on public.comentarios
  for each row execute function privado.notificar();

drop trigger if exists avances_notificar on public.avances;
create trigger avances_notificar after insert on public.avances
  for each row execute function privado.notificar();

drop trigger if exists proyectos_notificar on public.proyectos;
create trigger proyectos_notificar after update of estado, progreso on public.proyectos
  for each row execute function privado.notificar();
