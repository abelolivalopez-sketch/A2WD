# Portal de clientes A2WD · Guía de puesta en marcha

Tiempo estimado: 10 minutos. Todo se hace desde el panel web de Supabase, sin instalar nada.

> **Ya hecho por Claude en tu proyecto «A2WD Project»:** pasos 1, 5 y 6 (base de datos, función de invitaciones y conexión de la web). Te quedan los pasos 2, 3, 4 y 7.

## Qué incluye

| Archivo | Qué es |
|---|---|
| `portal/login.html` | Acceso para creadores y clientes, recuperar contraseña y crear contraseña al aceptar la invitación |
| `portal/creador.html` | Tu panel: resumen, clientes (CRM), proyectos, avances, mensajes y facturas |
| `portal/cliente.html` | Panel del cliente: estado del proyecto, vista previa de su web, avances y chat contigo |
| `portal/config.js` | Donde pegas la URL y la clave pública de Supabase |
| `supabase/schema.sql` | Tablas y reglas de seguridad de la base de datos |
| `supabase/functions/invitar-cliente/` | Función en servidor que envía las invitaciones por correo |

## Pasos

### 1. Crear la base de datos ✅ hecho
Supabase → **SQL Editor** → *New query* → pega todo `supabase/schema.sql` → **Run**.

### 2. Cerrar el registro público
**Authentication → Sign In / Providers** → desactiva **Allow new users to sign up**.
Así solo entra quien tú invites. Las invitaciones siguen funcionando.

### 3. Direcciones permitidas
**Authentication → URL Configuration**
- *Site URL*: `https://abelolivalopez-sketch.github.io/A2WD/portal/login.html`
- *Redirect URLs* → añade: `https://abelolivalopez-sketch.github.io/A2WD/portal/**`

### 4. Tu cuenta de creador
1. **Authentication → Users → Add user → Create new user**: tu correo y una contraseña, marca *Auto Confirm User*.
2. En **SQL Editor** ejecuta (con tu correo):
   ```sql
   update public.perfiles set rol = 'creador', nombre = 'Abel'
   where email = 'abelolivalopez@gmail.com';
   ```

### 5. Función de invitaciones ✅ hecho
**Edge Functions → Deploy a new function → Via Editor**
- Nombre: `invitar-cliente`
- Pega el contenido de `supabase/functions/invitar-cliente/index.ts` → **Deploy**.

La clave secreta la pone Supabase automáticamente dentro de la función; no tienes que copiarla en ningún sitio.

### 6. Conectar la web ✅ hecho
En `portal/config.js` pega la **Project URL** y la **clave pública** (`anon` / `publishable`). Sube los cambios a GitHub.

### 7. Correos (recomendado antes de invitar a clientes reales)
- **Authentication → Emails → Templates**: traduce al español la plantilla *Invite user* y *Reset password*.
- El correo incluido en Supabase solo permite unos pocos envíos por hora y es para pruebas. Para clientes reales configura un SMTP propio en **Authentication → Emails → SMTP Settings** (Resend o Brevo tienen plan gratuito).

## Cómo se usa

1. **Clientes → + Nuevo cliente** con su correo y datos.
2. En su ficha, **Invitar al portal**: recibe un correo, crea su contraseña y entra.
3. **+ Proyecto**: pega el enlace de la vista previa de su web.
4. **Publicar avance** cada vez que haya novedades; el cliente las ve al entrar.
5. Sus dudas aparecen en **Mensajes** (con contador de no leídos) y respondes desde el proyecto.

## Seguridad
- Las reglas están en la base de datos (Row Level Security): aunque alguien manipule la web, un cliente solo puede leer sus proyectos, avances y mensajes. Clientes, notas privadas y facturas solo los ven los creadores.
- Nadie puede cambiarse el rol a sí mismo; para añadir otro creador repite el paso 4.2 con su correo.
- Nunca pongas la clave `service_role` / `secret` en la web ni en GitHub.
- RGPD: añade a tu política de privacidad que guardas datos de contacto y facturación de clientes para la gestión de sus proyectos.

## Agente 1 · Analizador de dudas

Cada mensaje que escribe un cliente lo analiza la IA (Google Gemini, plan gratuito) y en tu panel verás:
- **Prioridad** (baja, media, alta, urgente) y **categoría** (duda, cambio de diseño, contenido, problema técnico, facturación, aprobación).
- Un **resumen** de una línea.
- Un **borrador de respuesta** en el idioma del cliente, y un aviso si hay que confirmar algo antes (precios, fechas…).

Pulsa **Usar respuesta** para copiarla al cuadro, revísala y envíala. El agente nunca contesta solo, y el cliente no ve el análisis.
Para mensajes antiguos o si algo falla, usa **✦ Analizar con IA** o **Volver a analizar**.

### Estado: ✅ activado
La clave de Gemini está guardada en la tabla privada `privado.ajustes` de Supabase (no en GitHub).
Para cambiarla: en Supabase → **SQL Editor** ejecuta
```sql
update privado.ajustes set valor = 'NUEVA-CLAVE', updated_at = now() where clave = 'GEMINI_API_KEY';
```
(También funciona como secreto `GEMINI_API_KEY` en **Edge Functions → Secrets**, que tiene prioridad.)

Notas:
- El plan gratuito tiene un límite diario de uso; si se alcanza, el panel lo avisa y basta con volver a analizar más tarde.
- En el plan gratuito Google puede usar el contenido para mejorar sus productos. No pidas a los clientes datos sensibles por el chat y menciónalo en tu política de privacidad.
- Si algún día queréis más calidad o privacidad, se puede usar Claude (de pago) añadiendo el secreto `ANTHROPIC_API_KEY` y borrando el de Gemini.
- Las claves viven solo en Supabase: nunca las pongas en la web ni en GitHub.

## Agente 2 · Asistente de ayuda para clientes

En el panel del cliente aparece el botón **✦ Asistente** (abajo a la derecha). Responde al momento, en el idioma del cliente,
usando **solo** lo que le enseñáis y los datos del proyecto de ese cliente (fase, progreso, avances). Nunca inventa precios ni plazos:
si no sabe algo, lo dice y ofrece el botón **«Pasar la pregunta al equipo»**, que la envía a vuestro chat del proyecto (y el Agente 1 la analiza).

### Entrenarlo (solo creadores) → panel · **✦ Asistente IA**
- **Conocimiento**: preguntas típicas y su respuesta. Escribidlas en español; el asistente las traduce solo. Podéis pausarlas sin borrarlas.
- **Preguntas de clientes**: todo lo que le preguntan. Las que **no sabía** salen marcadas (y con contador en el menú): pulsa
  **Enseñar respuesta**, escribe la respuesta y a partir de ese momento ya la sabe.
- **Probar**: chatea con él como si fueras un cliente (elige un proyecto para que use sus datos). Las pruebas no se guardan.

Ideas para enseñarle primero: plazos habituales de una web, qué necesitáis del cliente para empezar, formas de pago,
qué incluye el mantenimiento, cómo funciona el dominio y el hosting, cuántas revisiones incluye cada fase.

Límites: 30 preguntas por cliente y día. Usa Gemini gratis (primero `gemini-3.7-flash`; si está saturado, pasa solo a modelos ligeros).
