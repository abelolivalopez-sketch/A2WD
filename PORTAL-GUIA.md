# Portal de clientes A2WD · Guía de puesta en marcha

Tiempo estimado: 20–30 minutos. Todo se hace desde el panel web de Supabase, sin instalar nada.

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

### 1. Crear la base de datos
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

### 5. Función de invitaciones
**Edge Functions → Deploy a new function → Via Editor**
- Nombre: `invitar-cliente`
- Pega el contenido de `supabase/functions/invitar-cliente/index.ts` → **Deploy**.

La clave secreta la pone Supabase automáticamente dentro de la función; no tienes que copiarla en ningún sitio.

### 6. Conectar la web
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
