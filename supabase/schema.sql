-- =====================================================================
--  A2WD · Portal de clientes · Esquema de base de datos
--  Pegar entero en Supabase → SQL Editor → New query → Run
--  Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- ---------- 1. TABLAS ----------------------------------------------------

-- Una fila por cada cuenta que entra al portal (creadores y clientes)
create table if not exists public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nombre      text,
  rol         text not null default 'cliente' check (rol in ('creador','cliente')),
  created_at  timestamptz not null default now()
);

-- Ficha de cliente (CRM). Solo la ven los creadores.
create table if not exists public.clientes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references public.perfiles(id) on delete set null,
  nombre          text not null,
  empresa         text,
  email           text not null unique,
  telefono        text,
  nif             text,
  direccion       text,
  servicios       text,                     -- p. ej. "Web + mantenimiento"
  estado          text not null default 'activo' check (estado in ('potencial','activo','pausado','antiguo')),
  notas_privadas  text,
  created_at      timestamptz not null default now()
);

-- Proyectos (una web = un proyecto)
create table if not exists public.proyectos (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.clientes(id) on delete cascade,
  nombre         text not null,
  descripcion    text,
  url_preview    text,
  estado         text not null default 'diseno' check (estado in ('diseno','desarrollo','revision','entregado')),
  progreso       int  not null default 0 check (progreso between 0 and 100),
  fecha_entrega  date,
  created_at     timestamptz not null default now()
);

-- Avances publicados en un proyecto
create table if not exists public.avances (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  titulo       text not null,
  descripcion  text,
  url          text,
  created_at   timestamptz not null default now()
);

-- Comentarios / dudas en un proyecto
create table if not exists public.comentarios (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  autor_id     uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  autor_nombre text,
  autor_rol    text,
  mensaje      text not null check (char_length(mensaje) between 1 and 4000),
  leido        boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Facturas y presupuestos. Solo creadores.
create table if not exists public.facturas (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid not null references public.clientes(id) on delete cascade,
  proyecto_id        uuid references public.proyectos(id) on delete set null,
  tipo               text not null default 'factura' check (tipo in ('presupuesto','factura')),
  numero             text,
  concepto           text not null,
  base               numeric(10,2) not null default 0,
  iva_pct            numeric(5,2)  not null default 21,
  total              numeric(10,2) generated always as (round(base * (1 + iva_pct/100), 2)) stored,
  estado             text not null default 'pendiente' check (estado in ('borrador','pendiente','pagada','vencida','anulada')),
  fecha_emision      date not null default current_date,
  fecha_vencimiento  date,
  created_at         timestamptz not null default now()
);

create index if not exists proyectos_cliente_idx  on public.proyectos(cliente_id);
create index if not exists avances_proyecto_idx   on public.avances(proyecto_id);
create index if not exists comentarios_proy_idx   on public.comentarios(proyecto_id);
create index if not exists facturas_cliente_idx   on public.facturas(cliente_id);
create index if not exists comentarios_autor_idx  on public.comentarios(autor_id);
create index if not exists facturas_proyecto_idx  on public.facturas(proyecto_id);

-- ---------- 2. FUNCIONES DE APOYO ---------------------------------------
-- Van en un esquema "privado" que no se expone en la API.
create schema if not exists privado;
grant usage on schema privado to authenticated;

-- "security definer" = se ejecutan con permisos de sistema, para que las
-- reglas de acceso puedan consultar el rol sin quedar bloqueadas.

create or replace function privado.es_creador()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'creador');
$$;

create or replace function privado.mi_cliente_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.clientes where user_id = auth.uid();
$$;

-- Correos que al crear su cuenta reciben automáticamente el rol de creador.
-- Para añadir un compañero: insert into privado.creadores_autorizados values ('correo', 'Nombre');
create table if not exists privado.creadores_autorizados (
  email  text primary key,
  nombre text
);
revoke all on privado.creadores_autorizados from public, anon, authenticated;

-- Al crearse una cuenta (por invitación) se crea su perfil: creador si su
-- correo está autorizado; si no, cliente enlazado con la ficha del mismo correo.
create or replace function public.al_crear_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_creador privado.creadores_autorizados%rowtype;
begin
  select * into v_creador from privado.creadores_autorizados where email = lower(new.email);

  insert into perfiles (id, email, nombre, rol)
  values (new.id, lower(new.email),
          coalesce(v_creador.nombre, (select nombre from clientes where lower(email) = lower(new.email) limit 1)),
          case when v_creador.email is not null then 'creador' else 'cliente' end)
  on conflict (id) do nothing;

  if v_creador.email is null then
    update clientes set user_id = new.id
    where lower(email) = lower(new.email) and user_id is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.al_crear_usuario();

-- Si das de alta la ficha DESPUÉS de que exista la cuenta, también se enlaza
create or replace function public.enlazar_cliente()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null then
    select id into new.user_id from perfiles where lower(email) = lower(new.email) limit 1;
  end if;
  if new.user_id is not null then
    update perfiles set nombre = coalesce(nombre, new.nombre) where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists clientes_enlazar on public.clientes;
create trigger clientes_enlazar
  before insert or update of email on public.clientes
  for each row execute function public.enlazar_cliente();

-- Cada comentario guarda quién lo escribió (nombre y rol), sin que el
-- cliente pueda falsificarlo.
create or replace function public.firmar_comentario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.autor_id := auth.uid();
  select coalesce(nombre, email), rol into new.autor_nombre, new.autor_rol
  from perfiles where id = auth.uid();
  new.leido := (new.autor_rol = 'creador');
  return new;
end;
$$;

drop trigger if exists comentarios_firmar on public.comentarios;
create trigger comentarios_firmar
  before insert on public.comentarios
  for each row execute function public.firmar_comentario();

-- Las funciones de sistema no se pueden llamar desde fuera
revoke execute on function public.al_crear_usuario()  from public, anon, authenticated;
revoke execute on function public.enlazar_cliente()   from public, anon, authenticated;
revoke execute on function public.firmar_comentario() from public, anon, authenticated;
revoke execute on function privado.es_creador()        from public, anon;
revoke execute on function privado.mi_cliente_id()     from public, anon;
grant  execute on function privado.es_creador()        to authenticated;
grant  execute on function privado.mi_cliente_id()     to authenticated;

-- ---------- 3. REGLAS DE ACCESO (Row Level Security) --------------------

alter table public.perfiles    enable row level security;
alter table public.clientes    enable row level security;
alter table public.proyectos   enable row level security;
alter table public.avances     enable row level security;
alter table public.comentarios enable row level security;
alter table public.facturas    enable row level security;

-- Perfiles: cada uno ve el suyo; el creador ve y edita todos.
-- (Nadie puede cambiarse el rol a sí mismo.)
drop policy if exists perfiles_leer   on public.perfiles;
drop policy if exists perfiles_editar on public.perfiles;
create policy perfiles_leer   on public.perfiles for select to authenticated using (id = (select auth.uid()) or privado.es_creador());
create policy perfiles_editar on public.perfiles for update using (privado.es_creador()) with check (privado.es_creador());

-- Clientes y facturas: solo creadores
drop policy if exists clientes_creador on public.clientes;
create policy clientes_creador on public.clientes for all using (privado.es_creador()) with check (privado.es_creador());

drop policy if exists facturas_creador on public.facturas;
create policy facturas_creador on public.facturas for all using (privado.es_creador()) with check (privado.es_creador());

-- Proyectos: creador todo; cliente solo lee los suyos
drop policy if exists proyectos_creador on public.proyectos;
drop policy if exists proyectos_cliente on public.proyectos;
create policy proyectos_creador on public.proyectos for all using (privado.es_creador()) with check (privado.es_creador());
create policy proyectos_cliente on public.proyectos for select using (cliente_id = privado.mi_cliente_id());

-- Avances: creador todo; cliente lee los de sus proyectos
drop policy if exists avances_creador on public.avances;
drop policy if exists avances_cliente on public.avances;
create policy avances_creador on public.avances for all using (privado.es_creador()) with check (privado.es_creador());
create policy avances_cliente on public.avances for select
  using (proyecto_id in (select id from public.proyectos where cliente_id = privado.mi_cliente_id()));

-- Comentarios: creador todo; cliente lee y escribe en sus proyectos
drop policy if exists comentarios_creador  on public.comentarios;
drop policy if exists comentarios_cli_leer on public.comentarios;
drop policy if exists comentarios_cli_esc  on public.comentarios;
create policy comentarios_creador  on public.comentarios for all using (privado.es_creador()) with check (privado.es_creador());
create policy comentarios_cli_leer on public.comentarios for select
  using (proyecto_id in (select id from public.proyectos where cliente_id = privado.mi_cliente_id()));
create policy comentarios_cli_esc  on public.comentarios for insert
  with check (proyecto_id in (select id from public.proyectos where cliente_id = privado.mi_cliente_id()));

-- =====================================================================
--  DESPUÉS DE EJECUTAR ESTO:
--  1) Authentication → Users → "Add user" → crea TU cuenta (tu correo + contraseña,
--     marca "Auto confirm user").
--  2) Conviértete en creador ejecutando (cambia el correo):
--
--     update public.perfiles set rol = 'creador', nombre = 'Abel'
--     where email = 'abelolivalopez@gmail.com';
--
--  Repite el paso 2 con cualquier compañero que deba ser creador.
-- =====================================================================
