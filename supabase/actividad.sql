create table if not exists public.visitas (
  id           bigint generated always as identity primary key,
  creada       timestamptz not null default now(),
  pagina       text not null check (char_length(pagina) <= 120),
  tipo         text not null default 'vista' check (tipo in ('vista', 'contacto')),
  detalle      text check (char_length(detalle) <= 40),
  entrada      boolean not null default false,
  referente    text check (char_length(referente) <= 120),
  campana      text check (char_length(campana) <= 60),
  dispositivo  text check (dispositivo in ('movil', 'tableta', 'ordenador')),
  idioma       text check (char_length(idioma) <= 5),
  zona         text check (char_length(zona) <= 60)
);

create index if not exists visitas_creada_idx on public.visitas (creada desc);

alter table public.visitas enable row level security;
drop policy if exists visitas_creador on public.visitas;
create policy visitas_creador on public.visitas for select to authenticated
  using (privado.es_creador());

revoke all on public.visitas from anon, authenticated;
grant select on public.visitas to authenticated;

create or replace function public.registrar_visita(
  p_pagina      text,
  p_tipo        text default 'vista',
  p_detalle     text default null,
  p_entrada     boolean default false,
  p_referente   text default null,
  p_campana     text default null,
  p_dispositivo text default null,
  p_idioma      text default null,
  p_zona        text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if (select count(*) from public.visitas where creada > now() - interval '1 minute') >= 300 then
    return;
  end if;
  insert into public.visitas (pagina, tipo, detalle, entrada, referente, campana, dispositivo, idioma, zona)
  values (
    left(coalesce(nullif(trim(p_pagina), ''), '/'), 120),
    case when p_tipo = 'contacto' then 'contacto' else 'vista' end,
    nullif(left(trim(p_detalle), 40), ''),
    coalesce(p_entrada, false) and p_tipo is distinct from 'contacto',
    nullif(left(lower(trim(p_referente)), 120), ''),
    nullif(left(lower(trim(p_campana)), 60), ''),
    case when p_dispositivo in ('movil', 'tableta', 'ordenador') then p_dispositivo end,
    nullif(left(lower(trim(p_idioma)), 5), ''),
    nullif(left(trim(p_zona), 60), '')
  );
end $$;

revoke execute on function public.registrar_visita(text, text, text, boolean, text, text, text, text, text) from public;
grant execute on function public.registrar_visita(text, text, text, boolean, text, text, text, text, text) to anon, authenticated;

select cron.schedule(
  'limpiar-visitas',
  '17 3 1 * *',
  $$delete from public.visitas where creada < now() - interval '25 months'$$
);
