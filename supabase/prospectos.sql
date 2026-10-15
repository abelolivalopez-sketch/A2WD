-- =====================================================================
--  PROSPECTOS · negocios a los que queremos ofrecer una web (captación)
--
--  Va aparte de «clientes» porque aquí entra cualquier negocio de una
--  lista (CSV de Google Maps, una visita, una feria…), aunque todavía no
--  tengamos su correo. Cuando dice que sí, se crea en «clientes» y se
--  guarda aquí su cliente_id. Solo lo ven los creadores (RLS).
--
--  Importar un CSV:
--    Supabase › Table Editor › prospectos › Insert › Import data from CSV
--    La primera fila del CSV lleva los nombres de columna (las que falten
--    se quedan vacías): negocio, sector, ciudad, direccion, telefono,
--    email, web, valoracion, resenas, fuente, notas
--    · valoracion con punto decimal (4.6, no 4,6)
--    · después de importar, mirad la vista prospectos_duplicados
-- =====================================================================

create table if not exists public.prospectos (
  id            uuid primary key default gen_random_uuid(),
  negocio       text not null,
  sector        text,                          -- boulangerie, restaurante, gîte, peluquería…
  ciudad        text,                          -- Bayeux, Sevilla…
  direccion     text,
  telefono      text,
  email         text,
  web           text,                          -- vacío = no tiene web
  valoracion    numeric(2,1) check (valoracion between 0 and 5),   -- estrellas en Google
  resenas       integer check (resenas >= 0),                       -- nº de reseñas en Google
  fuente        text,                          -- de dónde sale: «maps bayeux oct», «visita»…
  estado        text not null default 'nuevo'
                check (estado in ('nuevo', 'contactado', 'interesado', 'demo', 'propuesta', 'ganado', 'descartado')),
  responsable   uuid references public.perfiles(id) on delete set null,
  proximo_paso  date,
  notas         text,
  cliente_id    uuid references public.clientes(id) on delete set null,   -- al convertirlo en cliente
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists prospectos_estado_idx  on public.prospectos (estado, proximo_paso);
create index if not exists prospectos_negocio_idx on public.prospectos (lower(negocio), ciudad);

-- Fecha de la última modificación (función ya creada en asistente.sql)
drop trigger if exists prospectos_tocar on public.prospectos;
create trigger prospectos_tocar before update on public.prospectos
  for each row execute function public.tocar_updated_at();

-- Solo creadores
alter table public.prospectos enable row level security;
drop policy if exists prospectos_creador on public.prospectos;
create policy prospectos_creador on public.prospectos for all to authenticated
  using (privado.es_creador()) with check (privado.es_creador());

-- ---------------------------------------------------------------------
--  Vistas (respetan las reglas de quien consulta: security_invoker)
-- ---------------------------------------------------------------------

-- A quién llamar primero: sin web, con clientela (reseñas) y bien valorados
create or replace view public.prospectos_prioridad with (security_invoker = true) as
select p.*,
       (case when coalesce(trim(p.web), '') = '' then 2 else 0 end
      + case when coalesce(p.resenas, 0) >= 20     then 1 else 0 end
      + case when coalesce(p.valoracion, 0) >= 4.3 then 1 else 0 end) as puntos
from public.prospectos p
where p.estado not in ('ganado', 'descartado');

-- Posibles duplicados tras importar (mismo negocio en la misma ciudad)
create or replace view public.prospectos_duplicados with (security_invoker = true) as
select lower(negocio) as negocio, ciudad, count(*) as veces, array_agg(id order by created_at) as ids
from public.prospectos
group by lower(negocio), ciudad
having count(*) > 1;

-- Embudo: cuántos hay en cada paso
create or replace view public.prospectos_embudo with (security_invoker = true) as
select estado, count(*) as negocios
from public.prospectos
group by estado;
