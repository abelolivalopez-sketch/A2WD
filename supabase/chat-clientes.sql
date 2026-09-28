-- =====================================================================
--  Chat de clientes activo
--  - Cada cliente tiene UNA conversación con A2WD (todos sus mensajes),
--    aunque todavía no tenga ningún proyecto.
--  - Los mensajes llevan cliente_id; proyecto_id pasa a ser opcional.
--  - Tiempo real: la tabla se publica en Supabase Realtime (las reglas de
--    seguridad siguen aplicándose: cada cliente solo recibe lo suyo).
-- =====================================================================

alter table public.comentarios add column if not exists cliente_id uuid references public.clientes(id) on delete cascade;
update public.comentarios c set cliente_id = p.cliente_id
  from public.proyectos p where p.id = c.proyecto_id and c.cliente_id is null;
alter table public.comentarios alter column proyecto_id drop not null;
create index if not exists comentarios_cliente_idx on public.comentarios (cliente_id, created_at);

-- Firma el mensaje y le asigna su cliente
create or replace function public.firmar_comentario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.autor_id := auth.uid();
  select coalesce(nombre, email), rol into new.autor_nombre, new.autor_rol
  from perfiles where id = auth.uid();
  new.leido := (new.autor_rol = 'creador');
  if new.proyecto_id is not null then
    select cliente_id into new.cliente_id from proyectos where id = new.proyecto_id;
  elsif new.autor_rol <> 'creador' then
    new.cliente_id := privado.mi_cliente_id();
  end if;
  if new.cliente_id is null then raise exception 'El mensaje necesita un cliente'; end if;
  return new;
end;
$$;

alter table public.comentarios alter column cliente_id set not null;

-- Reglas: el cliente lee y escribe solo en su conversación
drop policy if exists comentarios_cli_leer on public.comentarios;
drop policy if exists comentarios_cli_esc  on public.comentarios;
create policy comentarios_cli_leer on public.comentarios for select
  using (cliente_id = privado.mi_cliente_id());
create policy comentarios_cli_esc on public.comentarios for insert
  with check (cliente_id = privado.mi_cliente_id()
              and (proyecto_id is null or proyecto_id in (select id from public.proyectos where cliente_id = privado.mi_cliente_id())));

-- Tiempo real
do $$ begin
  alter publication supabase_realtime add table public.comentarios;
exception when duplicate_object then null; end $$;

-- Los borradores de la IA también llegan en tiempo real al panel de creadores
do $$ begin
  alter publication supabase_realtime add table public.comentarios_ia;
exception when duplicate_object then null; end $$;
