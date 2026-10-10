-- =====================================================================
--  TRADUCCIONES DE RODOLFO · francés (fr) e inglés (en) · octubre 2026
--  Una fila por respuesta original en español, enlazada con traduccion_de.
--  Entran PAUSADAS (activo = false): revisadlas y activadlas con
--    update public.conocimiento set activo = true where idioma in ('fr','en');
--  Se puede ejecutar varias veces: si una traducción ya existe, se salta.
--  (No se traduce «por cuanto pueden diseñar una pagina web para mi»:
--   repite la de «¿Cuánto cuesta una web? ¿Tenéis precios?».)
-- =====================================================================
insert into public.conocimiento (pregunta, respuesta, categoria, audiencia, activo, idioma, traduccion_de)
select v.pregunta, v.respuesta, o.categoria, o.audiencia, false, v.idioma, o.id
from (values
-- Contacto · ¿Cómo contacto con vosotros directamente?
('e9ca92bb-c6ff-4f15-b0f8-ce89e27f8c96'::uuid, 'fr', $$Comment vous contacter directement ?$$,
 $$Par le chat « Questions et commentaires » de votre espace client : c'est le plus rapide pour votre projet lorsque vous êtes client. Vous pouvez aussi nous écrire par e-mail ou par WhatsApp depuis la section Contact de notre site.$$),
('e9ca92bb-c6ff-4f15-b0f8-ce89e27f8c96'::uuid, 'en', $$How can I contact you directly?$$,
 $$Through the "Questions and comments" chat in your client area: it's the fastest way for your project once you're a client. You can also email us or message us on WhatsApp from the Contact section of our website.$$),
-- Contacto · ¿Cómo puedo pediros una web o un presupuesto?
('64254eec-7742-4486-a88d-89e5b17cf745'::uuid, 'fr', $$Comment vous demander un site ou un devis ?$$,
 $$Écrivez-nous depuis le formulaire de la section « Contact » de ce site en nous expliquant votre besoin, ou par WhatsApp ou e-mail depuis cette même section. Nous vous répondons au plus vite et préparons une proposition sur mesure.$$),
('64254eec-7742-4486-a88d-89e5b17cf745'::uuid, 'en', $$How can I ask you for a website or a quote?$$,
 $$Write to us using the form in the "Contact" section of this website and tell us what you need, or reach us on WhatsApp or by email from that same section. We'll reply as soon as possible and prepare a tailored proposal.$$),
-- Contenido · ¿Cómo os envío fotos o textos para la web?
('c663d9da-48b1-4747-88af-54f448f8efb8'::uuid, 'fr', $$Comment vous envoyer des photos ou des textes pour le site ?$$,
 $$Pour l'instant, prévenez-nous via « Questions et commentaires » dans votre espace client et nous vous indiquerons la meilleure façon de nous les envoyer (e-mail ou WhatsApp), selon la taille des fichiers.$$),
('c663d9da-48b1-4747-88af-54f448f8efb8'::uuid, 'en', $$How do I send you photos or text for the website?$$,
 $$For now, let us know through "Questions and comments" in your client area and we'll tell you the best way to send them (email or WhatsApp), depending on the file size.$$),
-- Estudio · ¿Qué es A2WD y quién está detrás?
('9a375f27-bf58-4798-b62e-ab7c284e043c'::uuid, 'fr', $$Qu'est-ce qu'A2WD et qui se cache derrière ?$$,
 $$A2WD est un petit studio de design et de développement web fondé par Abel Oliva (ingénierie mécanique) et Ariel Occhietti (ingénierie informatique). Nous concevons et réalisons des sites sur mesure pour les commerces et entreprises locales : rapides, clairs et pensés pour vendre.$$),
('9a375f27-bf58-4798-b62e-ab7c284e043c'::uuid, 'en', $$What is A2WD and who is behind it?$$,
 $$A2WD is a small web design and development studio founded by Abel Oliva (mechanical engineering) and Ariel Occhietti (computer engineering). We design and build custom websites for shops and local businesses: fast, clear and built to sell.$$),
-- Estudio · ¿En qué idiomas trabajáis?
('8f08a331-b5ca-4d76-b194-7e9843e09eaf'::uuid, 'fr', $$Dans quelles langues travaillez-vous ?$$,
 $$Nous travaillons en espagnol, français, italien et anglais. Vous pouvez nous écrire dans n'importe laquelle de ces langues.$$),
('8f08a331-b5ca-4d76-b194-7e9843e09eaf'::uuid, 'en', $$Which languages do you work in?$$,
 $$We work in Spanish, French, Italian and English. You can write to us in any of them.$$),
-- Estudio · ¿Qué proyectos habéis hecho?
('3b691bad-b203-44f2-b1ef-f38cbfcc6e62'::uuid, 'fr', $$Quels projets avez-vous réalisés ?$$,
 $$Nous débutons, la liste est donc encore courte. Dans la section « Projets » du site, vous en trouverez deux : « Viajes pa pobres », un site de guides de voyage nourris d'expériences personnelles, et « Tinyhouse », le site d'un petit bed and breakfast en France.$$),
('3b691bad-b203-44f2-b1ef-f38cbfcc6e62'::uuid, 'en', $$What projects have you done?$$,
 $$We're just starting out, so the list is still short. In the "Projects" section of the website you can see two: "Viajes pa pobres", a travel-guide website built on personal experiences, and "Tinyhouse", the website of a small bed and breakfast in France.$$),
-- Portal · ¿Dónde veo cómo va mi web?
('f7ebb0f1-f818-4751-b40d-895720aaa67c'::uuid, 'fr', $$Où puis-je voir où en est mon site ?$$,
 $$Dans votre espace client, vous voyez votre projet avec sa phase, le pourcentage d'avancement, la date de livraison prévue (si elle est déjà fixée) et un aperçu du site. Le bouton « Ouvrir le site » l'ouvre dans un nouvel onglet.$$),
('f7ebb0f1-f818-4751-b40d-895720aaa67c'::uuid, 'en', $$Where can I see how my website is going?$$,
 $$In your client area you'll see your project with its phase, the progress percentage, the planned delivery date (if already set) and a preview of the website. The "Open website" button opens it in a new tab.$$),
-- Portal · ¿Dónde veo las novedades de mi proyecto?
('4239cba7-2a1c-40e2-b02b-1e23a0a79950'::uuid, 'fr', $$Où voir les nouveautés de mon projet ?$$,
 $$Dans la section « Avancement » de votre espace client, nous publions chaque nouveauté importante, avec une courte explication et parfois un lien pour la voir.$$),
('4239cba7-2a1c-40e2-b02b-1e23a0a79950'::uuid, 'en', $$Where can I see my project's updates?$$,
 $$In the "Updates" section of your client area we post every important update, with a short explanation and sometimes a link to see it.$$),
-- Portal · ¿Qué significan las fases del proyecto?
('75cccb9d-9810-4bc2-abf8-d8607b21b881'::uuid, 'fr', $$Que signifient les phases du projet ?$$,
 $$Design : nous préparons l'apparence et la structure. Développement : nous construisons le site. Révision : le site est visible et nous attendons vos commentaires pour l'ajuster. Livré : le site est terminé et en ligne.$$),
('75cccb9d-9810-4bc2-abf8-d8607b21b881'::uuid, 'en', $$What do the project phases mean?$$,
 $$Design: we prepare the look and the structure. Development: we build the website. Review: the website can already be viewed and we're waiting for your comments to fine-tune it. Delivered: the website is finished and published.$$),
-- Portal · ¿Cómo os pido un cambio o una corrección?
('64ff9fe3-062b-4cc5-9039-c09a0bc1d02c'::uuid, 'fr', $$Comment vous demander une modification ou une correction ?$$,
 $$Écrivez-la dans « Questions et commentaires » de votre espace client, en précisant ce que vous voulez changer et où (par exemple : « sur la page d'accueil, remplacer la photo principale par… »). Nous la recevons aussitôt et vous répondons dans ce même chat.$$),
('64ff9fe3-062b-4cc5-9039-c09a0bc1d02c'::uuid, 'en', $$How do I ask you for a change or a fix?$$,
 $$Write it in "Questions and comments" in your client area, saying what you want to change and where (for example: "on the home page, replace the main photo with…"). We get it instantly and reply in the same chat.$$),
-- Portal · ¿Cómo cambio mi contraseña?
('1d1f40ca-baa8-4be1-ac82-e151f0a78860'::uuid, 'fr', $$Comment changer mon mot de passe ?$$,
 $$Une fois connecté à votre espace, appuyez sur le bouton « Mot de passe » en haut à droite, saisissez le nouveau deux fois puis appuyez sur « Enregistrer ». Si vous l'avez oublié, appuyez sur « Mot de passe oublié ? » sur l'écran de connexion.$$),
('1d1f40ca-baa8-4be1-ac82-e151f0a78860'::uuid, 'en', $$How do I change my password?$$,
 $$Once you're logged in, tap the "Password" button at the top right, type the new one twice and tap "Save". If you've forgotten it, tap "Forgot your password?" on the login screen.$$),
-- Portal · ¿Puedo modificar yo el código de mi web?
('e0b93294-5fa0-4063-9eb6-a06d05ec1d55'::uuid, 'fr', $$Puis-je modifier moi-même le code de mon site ?$$,
 $$Ce n'est pas nécessaire : nous nous occupons de toutes les modifications. Depuis votre espace, vous pouvez voir votre site et nous demander n'importe quel ajustement, sans rien toucher de technique.$$),
('e0b93294-5fa0-4063-9eb6-a06d05ec1d55'::uuid, 'en', $$Can I edit my website's code myself?$$,
 $$There's no need: we take care of every change. From your client area you can see your website and ask us for any adjustment, without touching anything technical.$$),
-- Portal · ¿Quién puede ver mis datos y mis mensajes?
('5012577a-5a5a-4949-9731-b98a0e9b0ce6'::uuid, 'fr', $$Qui peut voir mes données et mes messages ?$$,
 $$Uniquement vous et l'équipe d'A2WD. Chaque client ne voit que ses propres projets et conversations.$$),
('5012577a-5a5a-4949-9731-b98a0e9b0ce6'::uuid, 'en', $$Who can see my data and my messages?$$,
 $$Only you and the A2WD team. Each client sees only their own projects and conversations.$$),
-- Portal · ¿Qué pasa cuando ya soy cliente?
('f9c9b073-0bf7-4599-b313-0e4c37832ce2'::uuid, 'fr', $$Que se passe-t-il une fois que je suis client ?$$,
 $$Nous vous donnons accès à votre espace client sur ce site (« Espace client »), où vous suivez l'avancement de votre site et les nouveautés, et où vous pouvez nous écrire directement.$$),
('f9c9b073-0bf7-4599-b313-0e4c37832ce2'::uuid, 'en', $$What happens once I'm a client?$$,
 $$We give you access to your client area on this website ("Client area"), where you can follow your website's progress and updates, and write to us directly.$$),
-- Precios (clientes) · ¿Cuánto cuesta una web? ¿Qué precios tenéis?
('37faeab5-3bba-41e1-9d2c-db50f0ae1ed1'::uuid, 'fr', $$Combien coûte un site ? Quels sont vos tarifs ?$$,
 $$Prix HT, avec un devis ferme avant de commencer : Essentiel (site d'une page, WhatsApp, plan et horaires) à partir de 490 €, délai 1 semaine. Commerce (jusqu'à 5 pages, formulaire, fiche Google et SEO de base) à partir de 890 €, délai 2–3 semaines ; c'est le plus choisi. Réservations / Boutique (réservations en ligne ou petite boutique avec paiement par carte) à partir de 1 690 €, délai 4–6 semaines. Options : langue supplémentaire avec vraie traduction +150 € par langue, page supplémentaire +90 €, rédaction des textes +120 €, logo simple +150 €. Maintenance facultative après la mise en ligne : 29 €/mois (hébergement, sauvegardes, petites modifications et espace client) ou Maintenance Plus à 59 €/mois (2 h de modifications par mois, rapport de visites et priorité). Paiement : 50 % à l'acceptation et 50 % à la mise en ligne. Vous les retrouvez tous dans votre espace, dans le bloc « Nos tarifs ».$$),
('37faeab5-3bba-41e1-9d2c-db50f0ae1ed1'::uuid, 'en', $$How much does a website cost? What are your prices?$$,
 $$Prices exclude VAT, with a fixed quote before we start: Essential (one-page website, WhatsApp, map and opening hours) from €490, 1 week. Business (up to 5 pages, contact form, Google profile and basic SEO) from €890, 2–3 weeks; it's the most popular. Bookings / Shop (online bookings or a small shop with card payments) from €1,690, 4–6 weeks. Extras: additional language with real translation +€150 per language, extra page +€90, copywriting +€120, simple logo +€150. Optional care plan after launch: €29/month (hosting, backups, small changes and client area) or Plus at €59/month (2 h of changes per month, visitor report and priority). Payment: 50% on acceptance and 50% at launch. You'll find them all in your client area, in the "Our prices" block.$$),
-- Precios (visitantes) · ¿Cuánto cuesta una web? ¿Tenéis precios?
('3d9af909-f446-4fb9-bfda-18afa7a5b9c8'::uuid, 'fr', $$Combien coûte un site ? Avez-vous des tarifs ?$$,
 $$Chaque site est différent : nous préparons donc un devis ferme et sans engagement selon les besoins de votre activité. Écrivez-nous via le formulaire de contact ou par WhatsApp, nous vous répondons rapidement.$$),
('3d9af909-f446-4fb9-bfda-18afa7a5b9c8'::uuid, 'en', $$How much does a website cost? Do you have prices?$$,
 $$Every website is different, so we prepare a fixed, no-obligation quote based on what your business needs. Write to us through the contact form or on WhatsApp and we'll get back to you quickly.$$),
-- Proceso · Que tiempo tardáis en hacer una web?
('a49cbf9e-63bd-42fe-82c1-116e70192ba9'::uuid, 'fr', $$Combien de temps vous faut-il pour faire un site ?$$,
 $$Le délai dépend du type de site et de ses fonctionnalités : avant de commencer, nous vous donnons une date de livraison.$$),
('a49cbf9e-63bd-42fe-82c1-116e70192ba9'::uuid, 'en', $$How long does it take you to build a website?$$,
 $$It depends on the type of website and its features: before we start, we give you a delivery date.$$),
-- Servicios · ¿Qué servicios ofrecéis?
('125aa7c7-547c-41b5-aafe-dc7959b6af39'::uuid, 'fr', $$Quels services proposez-vous ?$$,
 $$Design sur mesure (sans modèles génériques), développement de sites légers et rapides, lien entre la boutique physique et le site, et accompagnement après la mise en ligne : ajustements, questions et améliorations au fil de la croissance de votre activité.$$),
('125aa7c7-547c-41b5-aafe-dc7959b6af39'::uuid, 'en', $$What services do you offer?$$,
 $$Custom design (no generic templates), development of light, fast websites, a link between your physical shop and your website, and support after launch: tweaks, questions and improvements as your business grows.$$),
-- Servicios · ¿Para qué tipo de negocios hacéis webs?
('e652db7a-5aac-4dae-8284-e8d623db938b'::uuid, 'fr', $$Pour quels types d'entreprises faites-vous des sites ?$$,
 $$Surtout pour les commerces et entreprises locales qui veulent un site clair, rapide et soigné : boutiques, hébergements, restauration, services… Chaque site est sur mesure, sans modèle générique.$$),
('e652db7a-5aac-4dae-8284-e8d623db938b'::uuid, 'en', $$What kinds of businesses do you build websites for?$$,
 $$Mainly shops and local businesses that want a clear, fast, polished website: stores, accommodation, restaurants, services… Every website is custom-made, with no generic templates.$$)
) as v(original, idioma, pregunta, respuesta)
join public.conocimiento o on o.id = v.original
on conflict (traduccion_de, idioma) where traduccion_de is not null do nothing;
