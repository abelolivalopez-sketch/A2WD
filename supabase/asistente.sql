-- =====================================================================
--  AGENTE 2 · Asistente de ayuda para clientes
-- =====================================================================

-- Conocimiento que los creadores enseñan al asistente (preguntas base y dudas típicas)
create table if not exists public.conocimiento (
  id          uuid primary key default gen_random_uuid(),
  pregunta    text not null check (char_length(pregunta) between 3 and 500),
  respuesta   text not null check (char_length(respuesta) between 1 and 4000),
  categoria   text not null default 'general',
  activo      boolean not null default true,
  autor_id    uuid default auth.uid() references public.perfiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Registro de lo que preguntan los clientes al asistente
create table if not exists public.asistente_preguntas (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid references public.perfiles(id) on delete set null,
  proyecto_id   uuid references public.proyectos(id) on delete set null,
  pregunta      text not null,
  respuesta     text,
  sabia         boolean not null default true,
  idioma        text,
  estado        text not null default 'nueva' check (estado in ('nueva','revisada','ensenada','enviada_equipo')),
  created_at    timestamptz not null default now()
);

create index if not exists asistente_preg_usuario_idx on public.asistente_preguntas(usuario_id, created_at);
create index if not exists asistente_preg_proyecto_idx on public.asistente_preguntas(proyecto_id);
create index if not exists conocimiento_autor_idx on public.conocimiento(autor_id);

alter table public.conocimiento        enable row level security;
alter table public.asistente_preguntas enable row level security;

-- Solo los creadores ven y editan el conocimiento y el registro.
-- (El asistente los lee desde el servidor; los clientes nunca acceden directamente.)
drop policy if exists conocimiento_creador on public.conocimiento;
create policy conocimiento_creador on public.conocimiento for all to authenticated
  using (privado.es_creador()) with check (privado.es_creador());

drop policy if exists asistente_preg_creador on public.asistente_preguntas;
create policy asistente_preg_creador on public.asistente_preguntas for all to authenticated
  using (privado.es_creador()) with check (privado.es_creador());

-- Fecha de modificación automática
create or replace function public.tocar_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
revoke execute on function public.tocar_updated_at() from public, anon, authenticated;
drop trigger if exists conocimiento_updated on public.conocimiento;
create trigger conocimiento_updated before update on public.conocimiento
  for each row execute function public.tocar_updated_at();
