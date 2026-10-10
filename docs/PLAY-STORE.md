# Publicar la app de A2WD en Google Play

La app ya existe: el portal es una **PWA** (`manifest.webmanifest`, `sw.js`, iconos, avisos y modo sin conexión). Para Google Play no hay que reescribirla: se envuelve en una app Android ligera (*Trusted Web Activity*) que abre el portal a pantalla completa. Lo que cambies en la web llega a la app sin publicar versión nueva.

> Datos de Google Play comprobados el 7 de octubre de 2026. Revisa los enlaces del final antes de pagar o enviar nada.

## ¿Hace falta ser empresa?

**Para publicar, no.** Hay dos tipos de cuenta de desarrollador (pago único de 25 USD en ambos casos):

| | Cuenta personal | Cuenta de organización |
|---|---|---|
| Quién | Una persona (Abel) | Una empresa registrada |
| Requisito especial | Prueba cerrada: 12 testers durante 14 días seguidos antes de pedir acceso a producción | Número **D-U-N-S**, que exige existir como empresa |
| Qué se ve en la ficha | Nombre de desarrollador que elijáis (p. ej. «A2WD») y, en «Acerca del desarrollador», el nombre legal, el país y el correo de quien abre la cuenta. Si se cobra dentro de Google Play, también la dirección completa | Los datos de la empresa |

**Recomendación:** empezar con cuenta personal de Abel y nombre de desarrollador «A2WD». La app es gratuita y para vuestros clientes, así que no se monetiza en Google Play. Cuando exista la empresa se puede abrir la cuenta de organización y transferir la app.

**Lo que sí pide la empresa es cobrar a clientes**, no la app: el portal ya calcula facturas e IVA, y `legal.html` dice que la web no tiene actividad comercial. Antes de la primera factura hay que darse de alta (en España, autónomos o una sociedad entre los dos) y adaptar `legal.html`. Es una decisión para hablar con una gestoría. Registrar la marca «A2WD» (OEPM o EUIPO) es un trámite aparte de crear la empresa.

## Requisito técnico que condiciona todo: el dominio

La app Android demuestra que la web es vuestra con un archivo `/.well-known/assetlinks.json` en la **raíz del dominio**. Ahora la web está en `abelolivalopez-sketch.github.io/A2WD/`, es decir, en una subcarpeta, y ese archivo no se puede poner en la raíz desde este repositorio.

Opciones:
1. **Dominio propio** (recomendado, unos 10–15 €/año): `a2wd.xx` apuntando a GitHub Pages. Sirve también para correos corporativos más adelante.
2. Crear el repositorio `abelolivalopez-sketch.github.io` solo para alojar `assetlinks.json`. Funciona, pero la app quedaría ligada a una dirección de GitHub.

Conviene decidir el dominio **antes** de publicar: cambiarlo después obliga a los clientes a reinstalar la app.

Detalle de GitHub Pages: las carpetas que empiezan por punto (`.well-known`) se ignoran salvo que haya un archivo `.nojekyll` en la raíz.

## Fases

### Fase 1 · Pruebas de usabilidad (ya, sin esperar a nada)
Con 3–5 personas que no conozcan el portal (un cliente real si es posible, compañeros de clase, familia). Cada sesión, 20–30 minutos, con su móvil, en persona o por videollamada con pantalla compartida. No les ayudéis: pedid que piensen en voz alta y apuntad dónde dudan.

**Tareas como cliente** (con una cuenta de prueba):
1. Abre la invitación del correo y crea tu contraseña.
2. Instala la app en tu móvil.
3. Dime en qué fase está tu proyecto y qué porcentaje lleva.
4. Abre la vista previa de tu web.
5. Pregunta al asistente cuánto tarda una web; luego pasa la pregunta al equipo.
6. Escribe al equipo pidiendo un cambio de color.
7. Activa los avisos y comprueba que te llega uno cuando te respondemos.
8. Desconecta los datos y vuelve a abrir la app.
9. Cierra sesión y vuelve a entrar.

**Tareas como creador** (Abel y Ariel, o alguien de confianza):
1. Da de alta un cliente, invítalo y créale un proyecto.
2. Publica un avance y cambia la fase.
3. Responde un mensaje usando el borrador de la IA.
4. Crea un presupuesto con la calculadora de tarifas.
5. Encuentra una factura vencida desde el Resumen.

**Qué apuntar en cada tarea:** ¿la terminó? (sí / con ayuda / no), tiempo aproximado, dónde se atascó, frases literales. Al final: «¿Qué cambiarías?» y una nota del 1 al 10 de lo fácil que fue.

**Para decidir qué arreglar:** lo que falle a 2 o más personas va primero.

### Fase 2 · Mejoras
Arreglar lo que salga de la Fase 1. Además, antes de Google Play:
- [ ] Opción de **borrar mi cuenta** en el panel del cliente y una página web para pedirlo (Google lo pide a las apps con cuentas de usuario; también ayuda con el RGPD).
- [ ] Política de privacidad específica de la app en `legal.html` (datos que guardáis, chat, avisos, uso de Gemini).
- [ ] Cuenta de cliente de demostración con un proyecto de ejemplo, para la revisión de Google.

### Fase 3 · Empaquetar para Android
1. Dominio propio configurado en GitHub Pages (y actualizar las URL de Supabase, `robots.txt` y `sitemap.xml`).
2. Generar el proyecto Android con **Bubblewrap** (`npx @bubblewrap/cli init --manifest https://<dominio>/manifest.webmanifest`) o con **PWABuilder** (web, sin instalar nada).
3. Subir `/.well-known/assetlinks.json` con la huella SHA-256 de la clave de firma que muestra Play Console (sección *Integridad de la app*) y añadir `.nojekyll`. Si la huella no coincide, la app se abre con la barra del navegador arriba.
4. Guardar la clave de subida (`.keystore`) y su contraseña fuera del repositorio, en dos sitios. Google guarda la clave de firma final; si perdéis la de subida se puede pedir otra, pero el trámite es lento.

### Fase 4 · Prueba cerrada en Google Play
1. Crear la cuenta de desarrollador (25 USD, verificación con DNI y tarjeta).
2. Subir la app al canal de **prueba cerrada** e invitar al menos a **12 testers** (con correo de Google) que la mantengan instalada **14 días seguidos**. Si alguien se sale y vuelve a entrar, su cuenta atrás empieza de nuevo: invitad a 15–20 por margen.
3. Aprovechad estos 14 días como segunda ronda de pruebas: un formulario corto al final («¿qué te costó?», «¿qué echas de menos?»).

### Fase 5 · Ficha y publicación
- Icono 512×512 (ya está: `img/icono-512.png`), imagen destacada 1024×500 y capturas del móvil.
- Descripción en ES/FR/IT/EN (se pueden reutilizar textos de `idiomas.js`).
- Cuestionarios de Play Console: acceso a la app (credenciales de demostración), seguridad de los datos, clasificación de contenido y público objetivo.
- Solicitar acceso a producción. Google suele responder en unos 7 días.

## Fuentes
- [Requisitos de prueba para cuentas personales nuevas](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Crear una cuenta personal: qué datos se muestran](https://support.google.com/googleplay/android-developer/answer/13628312)
- [Registro y cuota de Play Console](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Cuentas de organización y D-U-N-S](https://android-developers.googleblog.com/2023/07/boosting-trust-and-transparency-in-google-play.html)
- [Guía rápida de Trusted Web Activity (Bubblewrap y assetlinks)](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
