-- =====================================================================
--  CONSULTAS ÚTILES · Rodolfo por idiomas
--  Copia la que necesites en Supabase › SQL Editor y pulsa Run.
--  Cambia 'fr' por 'es', 'en' o 'it' según el idioma.
-- =====================================================================

-- 1) Preguntas que recibe Rodolfo, de un idioma (las más nuevas arriba)
select created_at::date as dia, origen, sabia, estado, pregunta, respuesta
  from public.asistente_preguntas
 where idioma = 'fr'
 order by created_at desc;

-- 2) Cuántas preguntas llegan en cada idioma, y cuántas no supo responder
select coalesce(idioma, '?') as idioma,
       count(*) as preguntas,
       count(*) filter (where not sabia) as no_sabia
  from public.asistente_preguntas
 group by 1
 order by 2 desc;

-- 3) Lo que Rodolfo sabe (conocimiento) en un idioma
select categoria, audiencia, activo, pregunta, respuesta
  from public.conocimiento
 where idioma = 'fr'
 order by categoria, created_at;

-- 4) Cada respuesta original y en qué idiomas está (true = existe)
select categoria, idioma_original, es, fr, en, it, pregunta
  from public.conocimiento_idiomas
 order by categoria;

-- 5) Respuestas a las que les falta la versión en inglés
select categoria, pregunta
  from public.conocimiento_idiomas
 where not en
 order by categoria;

-- 6) Una respuesta junto a sus traducciones (cambia el texto a buscar)
select k.idioma, k.activo, k.pregunta, k.respuesta
  from public.conocimiento k
  join public.conocimiento o on o.id = coalesce(k.traduccion_de, k.id)
 where o.pregunta ilike '%servicios%'
 order by (k.traduccion_de is not null), k.idioma;

-- 7) Activar las traducciones ya revisadas de un idioma
-- update public.conocimiento set activo = true where idioma = 'fr' and traduccion_de is not null;
