# Pendientes y hoja de ruta

Lista viva de lo que queda por hacer. Marca `[x]` al terminar y borra lo que ya no aplique.

## Web pública
*(Antes estaban en el archivo `Puntos` de la raíz.)*

- [ ] Fotos del equipo: decidir si queremos `filter: grayscale(1)`.
- [ ] Revisar los proyectos del portafolio y dar visibilidad a la web (Search Console, perfil de Google, enlaces desde redes).
- [ ] Añadir nuestros idiomas de trabajo y las redes sociales.

## Demo Boulangerie des Ducs (Gary)
Su web principal es **lareinemathilde.fr** (la pâtisserie, hecha en Drupal 9 por studio911.fr) y no menciona la boulangerie. Propuesta: no tocar su web; la boulangerie tiene su propio sitio y se enlaza desde el menú.

- [x] Presentación en francés para Gary (artifact «Boulangerie des Ducs · Proposition A2WD»).
- [ ] Recoger sus comentarios sobre la demo.
- [ ] Sustituir las fotos de ilustración (Unsplash) por fotos reales del fournil, la vitrine y los productos.
- [ ] Que el formulario de pedido envíe cada demanda por e-mail a la boutique (ahora solo es visual).
- [ ] Revisar con ellos los avisos de Google que salen en la demo.
- [ ] Subdominio `boulangerie.lareinemathilde.fr`: preparar la línea DNS (CNAME) y el archivo `CNAME` del sitio.
- [ ] Enlace «La Boulangerie» en el menú de lareinemathilde.fr (lo hacen ellos o su proveedor).

## Rodolfo en varios idiomas
- [x] Columnas `idioma` y `traduccion_de` en `conocimiento` (aplicado en Supabase el 7 oct).
- [x] 38 traducciones FR/EN cargadas en pausa (`supabase/traducciones-rodolfo.sql`).
- [ ] Revisar las traducciones y activarlas (consulta 7 de `supabase/consultas-idiomas.sql`).
- [ ] Al fusionar `abel` en `main`: desplegar la función `asistente-chat` actualizada.
- [ ] Corregir la respuesta de «Que tiempo tardáis en hacer una web?» (faltas y «deadline»).
- [ ] Borrar el duplicado «por cuanto pueden diseñar una pagina web para mi» (repite la de precios para visitantes).

## Portal: puesta en marcha (de `PORTAL-GUIA.md`)
Comprobar en Supabase que están hechos:

- [ ] Registro público cerrado (*Allow new users to sign up* desactivado).
- [ ] *Site URL* y *Redirect URLs* apuntando a la web.
- [ ] Plantillas de correo (invitación y contraseña) traducidas.
- [ ] SMTP propio (Resend o Brevo) antes de invitar a clientes reales.
- [ ] Borrar la cuenta de creador temporal cuando ya no haga falta.

## Decisiones de negocio
- [ ] **Dominio propio.** Hace falta antes de publicar en Google Play (ver `PLAY-STORE.md`); cambiarlo después obliga a reinstalar la app.
- [ ] **Forma jurídica** (autónomos o sociedad) antes de empezar a cobrar.
- [ ] **Cuenta de Google Play**: personal (Abel) para empezar, u organización cuando exista la empresa.
- [ ] Actualizar `legal.html` (privacidad) para la app: datos de clientes, chat, avisos al móvil y uso de Gemini.

## App en Google Play
Plan completo en [`PLAY-STORE.md`](PLAY-STORE.md).

- [ ] Fase 1 · Pruebas de usabilidad con 3–5 personas.
- [ ] Fase 2 · Mejoras a partir de las pruebas.
- [ ] Fase 3 · Dominio, `assetlinks.json` y empaquetado Android.
- [ ] Fase 4 · Prueba cerrada en Google Play (12 testers, 14 días seguidos).
- [ ] Fase 5 · Ficha, solicitud de producción y publicación.
