# Mensajes del formulario de la web

El formulario de contacto de `index.html` ya no abre el gestor de correo de quien escribe: envía el mensaje directamente.

1. El mensaje se guarda en Supabase (tabla `mensajes_web`).
2. Aparece en el panel de creador, en **Mensajes web**, y en la campana.
3. Llega un aviso al móvil de los creadores que tengan los avisos activados (el mismo sistema que el chat).
4. Llega un correo a `info@a2wdstudio.com` con los datos. Al pulsar **Responder** en Gmail, la respuesta va directa al correo del cliente.

Los mensajes son solo eso: mensajes. Nada se convierte en cliente automáticamente; si queréis darle un espacio de cliente, se crea a mano en **Clientes**.

## Por qué el correo no sale «desde» el cliente

Ningún servicio deja enviar un correo con el Gmail de otra persona como remitente: se marcaría como suplantación y se rechazaría. Por eso sale de `info@a2wdstudio.com` con el nombre «Formulario A2WD», y el correo del cliente va en «Responder a» y dentro del mensaje. Resend puede enviar desde cualquier dirección de a2wdstudio.com una vez verificado el dominio; no hace falta crear ningún buzón.

## Archivos

| Archivo | Qué hace |
|---|---|
| `supabase/mensajes-web.sql` | Tabla, función `enviar_mensaje_web` (la única forma de escribir desde la web), permisos, aviso al guardar, tiempo real y borrado mensual de lo que tenga más de 12 meses. También arregla `privado.notificar()` (ver abajo) |
| `supabase/functions/enviar-notificacion/index.ts` | Nuevo caso `mensajes_web`: correo por Resend y aviso push a los creadores |
| `index.html`, `assets/js/idiomas.js`, `assets/css/main.css` | Formulario que envía directo, con avisos en ES/FR/IT/EN y un campo trampa para robots |
| `portal/js/creador/buzon.js` | Sección **Mensajes web** del panel (`#buzon`) |
| `legal.html` | Privacidad: los mensajes se guardan en Supabase y se reenvían con Resend |
| `assets/js/actividad.js` | En **Actividad**, el formulario cuenta como contacto solo cuando el mensaje se ha guardado |

## Arreglo de los avisos al móvil (27 oct)

`privado.notificar()`, la función que llama a `enviar-notificacion` al guardar algo, fallaba sin dar error en todas las tablas menos `proyectos`. La condición de `proyectos` leía `new.estado` en la misma línea, y en tablas sin esa columna PostgreSQL da error. La función se tragaba el error y no avisaba.

Por eso nunca salían los avisos de:
- los mensajes de clientes;
- los avances;
- el chat de equipo.

Tampoco habrían salido los de este formulario. `mensajes-web.sql` vuelve a crear la función con la condición separada, y `notificaciones.sql` queda igual de arreglado.

## Protecciones

- La web no puede leer, cambiar ni borrar mensajes. Solo puede llamar a `enviar_mensaje_web`.
- Los creadores pueden leer, marcar como leído o archivado y borrar. No pueden cambiar el texto de un mensaje.
- Límites contra el spam:
  - 5 mensajes por hora desde el mismo correo;
  - 20 mensajes en 10 minutos en total;
  - un campo oculto `web` que solo rellenan los robots (si viene relleno, no se guarda nada).
- Si se pasa el límite, la persona ve «Hemos recibido muchos mensajes seguidos…» y se le propone WhatsApp.

## Puesta en marcha

1. **SQL.** Ejecutar `supabase/mensajes-web.sql` en *Supabase › SQL Editor*. Se puede repetir sin problema.
2. **Función.** Desplegar `enviar-notificacion` con este código, igual que antes: sin verificación de JWT, porque la protege su propio secreto.
3. **Correo con Resend** (gratis hasta 100 correos al día y 3.000 al mes):
   1. Crear la cuenta en https://resend.com con a2wd.web@gmail.com.
   2. *Domains › Add domain* › `a2wdstudio.com`. Resend da unos registros DNS (MX y TXT en `send`, y TXT en `resend._domainkey`).
   3. Añadir esos registros tal cual en Cloudflare, en *DNS › Records*. No tocan el reenvío de info@: Resend usa el subdominio `send` y el reenvío usa los MX del dominio raíz.
   4. Esperar a que Resend marque el dominio como verificado.
   5. *API Keys › Create API key* (permiso *Sending access*).
   6. En Supabase › *Edge Functions › Secrets*, crear `RESEND_API_KEY` con esa clave.
   7. Opcional: `CORREO_DESTINO` (por defecto `info@a2wdstudio.com`) y `CORREO_REMITENTE` (por defecto `Formulario A2WD <info@a2wdstudio.com>`).
4. **Publicar la web.** Fusionar en `main` cuando Ariel lo haya revisado. El SQL tiene que estar aplicado antes; si no, el formulario mostrará el aviso de error.

Sin la clave de Resend todo funciona menos el correo: el mensaje se guarda, sale en el panel y llega el aviso al móvil. En el panel, cada mensaje indica si el correo salió («Aviso enviado a info@»), si falta la clave («Aviso por correo sin configurar») o si Resend dio error (al pasar el ratón se ve el motivo).

## Probar

Con todo publicado, escribe un mensaje desde la web, con otro correo que no sea el de A2WD. Debe:
- salir en el panel, en **Mensajes web**;
- llegar el aviso al móvil;
- llegar el correo a info@;
- al pulsar **Responder** en Gmail, ir la respuesta a ese otro correo.

En el SQL Editor, `select nombre, correo_enviado_en, correo_error from mensajes_web order by created_at desc limit 5;` enseña si salió el correo.
