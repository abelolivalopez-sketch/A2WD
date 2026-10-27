# Actividad de la web

Panel de creador → **Actividad** (`#actividad`). Muestra cuánta gente entra en a2wdstudio.com, qué páginas ve, de dónde llega y cuántos pulsan un botón de contacto, con gráficas y exportación a Excel y CSV.

## Cómo funciona

```
Visitante abre una página ──► assets/js/actividad.js ──► Supabase: registrar_visita() ──► tabla visitas
Panel › Actividad ──► lee la tabla visitas (solo creadores) ──► gráficas, Excel y CSV
```

- **Medición propia, sin cookies y sin datos personales.** No se guarda la IP, ni un identificador, ni nada en el navegador del visitante. Por eso no hace falta banner de cookies (está explicado en `legal.html`, en español y en francés).
- Cada fila de `visitas` es una **página vista** o un **contacto**, con: página, si es una **visita nueva** (llega desde fuera de la web), web de procedencia, campaña (`utm_source`), dispositivo, idioma y zona horaria del navegador.
- **Visita** = llegada desde fuera (Google, Instagram, un enlace, el QR o escribiendo la dirección). Lo que se ve después dentro de la web suma **páginas vistas**. Recargar la página de entrada vuelve a contar como visita.
- **Contacto** = pulsar WhatsApp, un enlace de correo o de teléfono, o enviar el formulario de contacto (solo cuenta si el mensaje se guarda bien).
- **País**: sale de la zona horaria del navegador (Europe/Paris → Francia). Sin IP no hay ciudad.
- **No se cuenta**: fuera de a2wdstudio.com (Live Server, raw.githack), robots, navegadores con «Global Privacy Control» o «Do Not Track», y los dispositivos del equipo.

## Puesta en marcha (una vez)

1. Supabase → **SQL Editor** → *New query* → pega todo `supabase/actividad.sql` → **Run**. Crea la tabla `visitas`, la función `registrar_visita`, las reglas de seguridad y una tarea mensual que borra lo que tenga más de 25 meses. Se puede ejecutar dos veces sin problema.
2. Pull request de `abel` a `main` → **Merge**. Las visitas empiezan a contarse cuando Cloudflare publica el cambio.
3. Abrid el panel de creador en cada móvil y ordenador que uséis: así ese dispositivo deja de contar. En un dispositivo donde no entréis al panel, abrid una vez `https://a2wdstudio.com/?medir=no` (con `?medir=si` vuelve a contar).

## Saber de dónde viene cada visita

Añade `?utm_source=` a los enlaces que repartís y el panel los separa:

| Dónde | Enlace |
|---|---|
| QR de las tarjetas de visita | `https://a2wdstudio.com/?utm_source=tarjeta` |
| Biografía de Instagram | `https://a2wdstudio.com/?utm_source=instagram` |
| Firma del correo | `https://a2wdstudio.com/?utm_source=correo` |
| Pie de la web de Disputatio | `https://a2wdstudio.com/?utm_source=disputatio` |

Otros valores también funcionan: salen como «Campaña «valor»». **Antes de imprimir las tarjetas, cambiad el QR** para que lleve `?utm_source=tarjeta`.

## Exportar y verlo en Drive

Botón **Exportar** (icono de descarga en el móvil):

- **Excel con todo (.xlsx)**: hojas Resumen, Por día, Páginas, Procedencia, Dispositivos, Países, Idiomas, Contactos y Registro (una fila por página vista o contacto). Las fechas son fechas de verdad, para hacer gráficas.
- **CSV · visitas por día** y **CSV · registro completo**: separados por comas y en UTF-8, como los lee Google Hojas de cálculo.

Para tenerlo en Drive: **Nuevo → Subir archivo** en Google Drive y después **Abrir con → Hojas de cálculo de Google**. En el móvil, Exportar abre el menú de compartir: elige **Drive**. Para abrir un CSV con doble clic en Excel en español, mejor usar el .xlsx.

Exporta el periodo elegido arriba (7 días, 30 días, 3 meses o 12 meses).

## Archivos

| Archivo | Qué hace |
|---|---|
| `supabase/actividad.sql` | Tabla `visitas`, función `registrar_visita`, permisos y limpieza mensual |
| `assets/js/actividad.js` | Cuenta las visitas; va en las 12 páginas públicas |
| `portal/js/creador/actividad.js` | Sección Actividad del panel: datos, gráficas y exportación |
| `portal/js/creador/exportar.js` | Crea los .xlsx y .csv sin librerías externas |
| `portal/css/creador.css` | Estilos (bloque `.act-…`) |

- Una página nueva de la web pública necesita `<script type="module" src="assets/js/actividad.js"></script>` (junto a `instalar.js`) y su nombre en `PAGINAS`, al principio de `portal/js/creador/actividad.js`.
- La función acepta como mucho 300 registros por minuto, para que nadie pueda llenar la base de datos.
- El panel lee como mucho 50.000 registros por periodo. Con mucho tráfico habría que pasar los totales a una función de Supabase.
