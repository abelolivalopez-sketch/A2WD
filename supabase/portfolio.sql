-- =====================================================================
--  Gestión de la web: proyectos del portafolio de la página principal
--  - Los creadores los añaden, editan, ordenan y publican desde el panel.
--  - La web pública solo lee los publicados (sin iniciar sesión).
--  - Las capturas se guardan en el bucket público «portfolio».
-- =====================================================================

create table if not exists public.portfolio (
  id           uuid primary key default gen_random_uuid(),
  orden        int not null default 0,
  titulo       text not null check (char_length(titulo) between 1 and 120),
  descripcion  jsonb not null default '{}'::jsonb,          -- {"es": "...", "fr": "...", "it": "...", "en": "..."}
  url          text check (url is null or url ~* '^https?://'),
  imagen       text,                                        -- URL pública o ruta relativa de la web (img/…)
  etiquetas    text[] not null default '{}',
  publicado    boolean not null default true,
  proyecto_id  uuid references public.proyectos(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists portfolio_orden on public.portfolio (orden);

alter table public.portfolio enable row level security;
drop policy if exists portfolio_publico on public.portfolio;
create policy portfolio_publico on public.portfolio for select to anon using (publicado);
drop policy if exists portfolio_publico_auth on public.portfolio;
create policy portfolio_publico_auth on public.portfolio for select to authenticated using (publicado or privado.es_creador());
drop policy if exists portfolio_creador on public.portfolio;
create policy portfolio_creador on public.portfolio for all to authenticated using (privado.es_creador()) with check (privado.es_creador());
grant select on public.portfolio to anon;

drop trigger if exists portfolio_updated on public.portfolio;
create trigger portfolio_updated before update on public.portfolio
  for each row execute function public.tocar_updated_at();

-- Capturas del portafolio
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/webp','image/jpeg','image/png'];

drop policy if exists portfolio_ver on storage.objects;
create policy portfolio_ver on storage.objects for select to authenticated
  using (bucket_id = 'portfolio' and privado.es_creador());
drop policy if exists portfolio_subir on storage.objects;
create policy portfolio_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and privado.es_creador());
drop policy if exists portfolio_cambiar on storage.objects;
create policy portfolio_cambiar on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and privado.es_creador());
drop policy if exists portfolio_borrar on storage.objects;
create policy portfolio_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and privado.es_creador());

-- Los dos proyectos que ya estaban en la web
insert into public.portfolio (orden, titulo, descripcion, url, imagen, etiquetas)
select * from (values
  (1, 'Viajes pa pobres',
   jsonb_build_object(
     'es','Web diseñada para comercio de guías de viajes reales y con mucha alma. Proyecto de guías cortas en la que se cuentan experiencias personales bien detalladas.',
     'fr','Site conçu pour un commerce de guides de voyage authentiques et pleins d''âme. Un projet de guides courts qui racontent des expériences personnelles très détaillées.',
     'it','Sito pensato per un''attività di guide di viaggio autentiche e piene di anima. Un progetto di guide brevi che raccontano esperienze personali molto dettagliate.',
     'en','Website designed for a business selling real travel guides with plenty of soul. A project of short guides telling detailed personal experiences.'),
   'https://aocchietti.github.io/TAD/guias.html', 'img/proyecto-viajes.webp', array['HTML/CSS','JavaScript','Responsive']),
  (2, 'Tinyhouse',
   jsonb_build_object(
     'es','Web diseñada para pequeño bed and breakfast en Francia, intentamos sacar todos los puntos fuertes del emplazamiento para darle visibilidad en las redes, seguimos con la ayuda de marketing y publicidad en google.',
     'fr','Site conçu pour un petit bed and breakfast en France. Nous avons mis en valeur tous les atouts du lieu pour lui donner de la visibilité sur les réseaux, et nous poursuivons avec du marketing et de la publicité sur Google.',
     'it','Sito pensato per un piccolo bed and breakfast in Francia: abbiamo valorizzato tutti i punti di forza della struttura per darle visibilità sui social, e proseguiamo con marketing e pubblicità su Google.',
     'en','Website designed for a small bed and breakfast in France. We highlighted all the strengths of the location to give it visibility on social media, and we keep supporting it with marketing and Google ads.'),
   'https://abelolivalopez-sketch.github.io/WEB-AIRBNB/', 'img/proyecto-tinyhouse.webp', array['React','Node.js','SEO'])
) as v(orden, titulo, descripcion, url, imagen, etiquetas)
where not exists (select 1 from public.portfolio);
