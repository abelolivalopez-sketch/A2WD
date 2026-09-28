-- =====================================================================
--  Comunicación de equipo (solo creadores)
--  Chat interno entre los socios: canal «General» y un canal por proyecto.
--  Ni los clientes ni los visitantes pueden leerlo (Row Level Security).
-- =====================================================================

create table if not exists public.equipo_mensajes (
  id           uuid primary key default gen_random_uuid(),
  autor_id     uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  autor_nombre text,
  proyecto_id  uuid references public.proyectos(id) on delete cascade,   -- null = canal General
  mensaje      text not null check (char_length(mensaje) between 1 and 4000),
  created_at   timestamptz not null default now()
);
create index if not exists equipo_mensajes_canal on public.equipo_mensajes (proyecto_id, created_at);

-- Hasta dónde ha leído cada creador (para el contador de no leídos, en todos sus dispositivos)
create table if not exists public.equipo_lecturas (
  usuario_id uuid primary key default auth.uid() references public.perfiles(id) on delete cascade,
  visto_en   timestamptz not null default now()
);

alter table public.equipo_mensajes enable row level security;
alter table public.equipo_lecturas enable row level security;

drop policy if exists equipo_leer on public.equipo_mensajes;
create policy equipo_leer on public.equipo_mensajes for select to authenticated using (privado.es_creador());
drop policy if exists equipo_escribir on public.equipo_mensajes;
create policy equipo_escribir on public.equipo_mensajes for insert to authenticated
  with check (privado.es_creador() and autor_id = (select auth.uid()));
drop policy if exists equipo_borrar on public.equipo_mensajes;
create policy equipo_borrar on public.equipo_mensajes for delete to authenticated
  using (privado.es_creador() and autor_id = (select auth.uid()));

drop policy if exists lecturas_propias on public.equipo_lecturas;
create policy lecturas_propias on public.equipo_lecturas for all to authenticated
  using (usuario_id = (select auth.uid()) and privado.es_creador())
  with check (usuario_id = (select auth.uid()) and privado.es_creador());

revoke all on public.equipo_mensajes, public.equipo_lecturas from anon;

-- Firma el mensaje con el nombre del autor (no se puede falsificar desde la web)
create or replace function public.firmar_equipo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.autor_id := auth.uid();
  select coalesce(nombre, email) into new.autor_nombre from public.perfiles where id = new.autor_id;
  return new;
end $$;
revoke execute on function public.firmar_equipo() from public, anon, authenticated;
drop trigger if exists equipo_firmar on public.equipo_mensajes;
create trigger equipo_firmar before insert on public.equipo_mensajes
  for each row execute function public.firmar_equipo();

-- Aviso en el móvil a los demás creadores (reutiliza privado.notificar)
drop trigger if exists equipo_notificar on public.equipo_mensajes;
create trigger equipo_notificar after insert on public.equipo_mensajes
  for each row execute function privado.notificar();

-- Mensajes en tiempo real
do $$ begin
  alter publication supabase_realtime add table public.equipo_mensajes;
exception when duplicate_object then null; end $$;
