create or replace function privado.notificar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_secreto text;
begin
  select valor into v_secreto from privado.ajustes where clave = 'NOTIF_SECRET';
  if v_secreto is null then return new; end if;
  if tg_table_name = 'proyectos' then
    if new.estado is not distinct from old.estado
       and new.progreso is not distinct from old.progreso then
      return new;
    end if;
  end if;
  perform net.http_post(
    url     := 'https://vsqxcxmsvsektvsceqpx.supabase.co/functions/v1/enviar-notificacion',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-a2wd-secreto', v_secreto),
    body    := jsonb_build_object('tabla', tg_table_name, 'id', new.id)
  );
  return new;
exception when others then
  return new;
end $$;
revoke execute on function privado.notificar() from public, anon, authenticated;

create table if not exists public.mensajes_web (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null check (char_length(nombre) between 1 and 120),
  email             text not null check (char_length(email) between 3 and 200),
  asunto            text not null default '' check (char_length(asunto) <= 200),
  mensaje           text not null check (char_length(mensaje) between 1 and 5000),
  idioma            text not null default 'es' check (idioma in ('es','fr','it','en')),
  pagina            text not null default '' check (char_length(pagina) <= 200),
  leido             boolean not null default false,
  archivado         boolean not null default false,
  correo_enviado_en timestamptz,
  correo_error      text,
  created_at        timestamptz not null default now()
);
create index if not exists mensajes_web_fecha on public.mensajes_web (created_at desc);
create index if not exists mensajes_web_email on public.mensajes_web (email, created_at desc);

alter table public.mensajes_web enable row level security;

drop policy if exists mensajes_web_leer on public.mensajes_web;
create policy mensajes_web_leer on public.mensajes_web for select to authenticated
  using (privado.es_creador());

drop policy if exists mensajes_web_editar on public.mensajes_web;
create policy mensajes_web_editar on public.mensajes_web for update to authenticated
  using (privado.es_creador()) with check (privado.es_creador());

drop policy if exists mensajes_web_borrar on public.mensajes_web;
create policy mensajes_web_borrar on public.mensajes_web for delete to authenticated
  using (privado.es_creador());

revoke all on public.mensajes_web from anon, authenticated;
grant select, delete on public.mensajes_web to authenticated;
grant update (leido, archivado) on public.mensajes_web to authenticated;

create or replace function public.enviar_mensaje_web(
  p_nombre  text,
  p_email   text,
  p_asunto  text default '',
  p_mensaje text default '',
  p_idioma  text default 'es',
  p_pagina  text default '',
  p_trampa  text default ''
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_nombre  text := left(btrim(coalesce(p_nombre, '')), 120);
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_asunto  text := left(btrim(coalesce(p_asunto, '')), 200);
  v_mensaje text := left(btrim(coalesce(p_mensaje, '')), 5000);
begin
  if coalesce(p_trampa, '') <> '' then return; end if;
  if v_nombre = '' or v_mensaje = '' then
    raise exception 'faltan_datos' using errcode = '22023';
  end if;
  if char_length(v_email) > 200 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'correo_no_valido' using errcode = '22023';
  end if;
  if (select count(*) from public.mensajes_web where created_at > now() - interval '10 minutes') >= 20
     or (select count(*) from public.mensajes_web where email = v_email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'demasiados_mensajes' using errcode = 'P0001';
  end if;
  insert into public.mensajes_web (nombre, email, asunto, mensaje, idioma, pagina)
  values (
    v_nombre, v_email, v_asunto, v_mensaje,
    case when p_idioma in ('es','fr','it','en') then p_idioma else 'es' end,
    left(coalesce(p_pagina, ''), 200)
  );
end $$;

revoke execute on function public.enviar_mensaje_web(text, text, text, text, text, text, text) from public;
grant execute on function public.enviar_mensaje_web(text, text, text, text, text, text, text) to anon, authenticated;

drop trigger if exists mensajes_web_notificar on public.mensajes_web;
create trigger mensajes_web_notificar after insert on public.mensajes_web
  for each row execute function privado.notificar();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mensajes_web'
  ) then
    alter publication supabase_realtime add table public.mensajes_web;
  end if;
end $$;

select cron.schedule(
  'limpiar-mensajes-web',
  '27 3 1 * *',
  $$delete from public.mensajes_web where created_at < now() - interval '12 months'$$
);
