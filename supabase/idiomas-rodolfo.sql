-- =====================================================================
--  RODOLFO EN VARIOS IDIOMAS (octubre 2026)
--  · Cada respuesta del conocimiento dice en qué idioma está (es, fr, it, en).
--  · Una respuesta en francés o inglés puede ser la traducción de otra
--    (traduccion_de = id de la original), así se ve qué falta por traducir.
--  · Todo lo que ya había queda como 'es' y sin traducción: no cambia nada
--    de lo que funciona hoy.
--  Se puede ejecutar varias veces sin romper nada.
-- =====================================================================

alter table public.conocimiento
  add column if not exists idioma text not null default 'es';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'conocimiento_idioma_valido') then
    alter table public.conocimiento
      add constraint conocimiento_idioma_valido check (idioma in ('es', 'fr', 'it', 'en'));
  end if;
end $$;

alter table public.conocimiento
  add column if not exists traduccion_de uuid references public.conocimiento(id) on delete cascade;

create index if not exists conocimiento_idioma_idx on public.conocimiento(idioma, activo);
create index if not exists conocimiento_traduccion_idx on public.conocimiento(traduccion_de);
-- Una sola traducción por idioma de cada respuesta original
create unique index if not exists conocimiento_traduccion_unica
  on public.conocimiento(traduccion_de, idioma) where traduccion_de is not null;

-- Preguntas recibidas: el idioma siempre con dos letras ('fr-FR' → 'fr') para filtrar fácil
update public.asistente_preguntas
   set idioma = lower(left(idioma, 2))
 where idioma is not null and idioma <> lower(left(idioma, 2));
create index if not exists asistente_preg_idioma_idx on public.asistente_preguntas(idioma, created_at);

-- Vista: cada respuesta original y en qué idiomas existe (✓ = true)
-- security_invoker: respeta las reglas de seguridad (solo la ven los creadores)
create or replace view public.conocimiento_idiomas with (security_invoker = true) as
select o.id,
       o.categoria,
       o.audiencia,
       o.activo,
       o.idioma as idioma_original,
       o.pregunta,
       bool_or(k.idioma = 'es') as es,
       bool_or(k.idioma = 'fr') as fr,
       bool_or(k.idioma = 'en') as en,
       bool_or(k.idioma = 'it') as it
  from public.conocimiento o
  join public.conocimiento k on k.id = o.id or k.traduccion_de = o.id
 where o.traduccion_de is null
 group by o.id;

-- Para deshacerlo todo:
--   drop view if exists public.conocimiento_idiomas;
--   alter table public.conocimiento drop column if exists traduccion_de, drop column if exists idioma;
