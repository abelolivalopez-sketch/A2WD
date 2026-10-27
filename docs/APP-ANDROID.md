# App de A2WD para Android

La app de Android es el mismo portal (`portal/`) metido en una app propia: paquete `com.a2wdstudio.app`, icono de A2WD, pantalla de arranque oscura, sin barra de direcciones y con los avisos como cualquier otra app. Se instala desde un archivo `A2WD.apk` y, más adelante, desde Google Play.

Técnicamente es una *Trusted Web Activity* (TWA): por dentro usa el motor de Chrome del móvil, pero no se ve Chrome en ningún momento. Lo que cambiéis en la web llega a la app sin publicar versión nueva. Solo hay que volver a compilarla si cambia el nombre, el icono, los colores o la dirección con la que arranca.

**iPhone:** sigue siendo la web instalada desde Safari (botón «Añadir a mi móvil»). Para tener una app en la App Store hace falta la cuenta de desarrollador de Apple (99 USD al año) y un Mac, y Apple suele rechazar las apps que solo abren una web.

## Qué hay en el repositorio

| Archivo | Para qué sirve |
|---|---|
| `app-android/` | Proyecto Android, hecho con las plantillas de Bubblewrap 1.27 (la herramienta de Google para TWA) |
| `.github/workflows/app-android.yml` | Compila la app en GitHub, comprueba la firma y publica `A2WD.apk` en *Releases* |
| `.well-known/assetlinks.json` | Demuestra que a2wdstudio.com es vuestra. Sin él la app enseña la barra de direcciones |
| `instalar.js` | En Android, «Añadir a mi móvil» ofrece descargar la app (y, como alternativa, el acceso directo de siempre) |

## La clave de firma

Cada versión de la app se firma con `a2wd-firma.keystore` (alias `a2wd`). Va en un zip aparte, **nunca en el repositorio** (el `.gitignore` de `app-android/` lo impide).

- Guardad el zip en dos sitios privados (por ejemplo, Drive y un disco).
- Si se pierde, los móviles que ya tienen la app no podrán actualizarla: habría que publicar otra app.
- Huella SHA-256 de la clave (la misma que hay en `assetlinks.json`):
  `A7:E5:C1:2C:73:6F:D7:19:E0:AD:E5:04:D0:77:30:70:8B:85:AD:C7:19:FF:23:88:15:3F:4D:1F:BC:9F:9A:D7`

## Puesta en marcha (una sola vez)

1. **Secretos en GitHub.** En el repositorio: *Settings › Secrets and variables › Actions › New repository secret*. Crear dos:
   - `A2WD_KEYSTORE_BASE64`: todo el texto de `a2wd-firma.base64.txt` (del zip de la firma).
   - `A2WD_KEYSTORE_PASSWORD`: la contraseña que viene en `LEEME-FIRMA.txt`.
2. **Subir los archivos a `abel`** con GitKraken. Al hacer *push*, GitHub compila la app sola: pestaña *Actions › App Android* (tarda unos 5–8 minutos).
3. **Descargar.** Al terminar aparece en *Releases* «App A2WD para Android 1.0.N» con `A2WD.apk`. El enlace fijo a la última versión es
   https://github.com/abelolivalopez-sketch/A2WD/releases/latest/download/A2WD.apk
4. **Publicar en la web.** Fusionad en `main` (pull request). Después comprobad que https://a2wdstudio.com/.well-known/assetlinks.json abre el JSON. Si no se abre, hay que revisar el proyecto `a2wd` en Cloudflare.
5. **Probar en un Android.** Descargar, instalar y abrir. No debe verse barra de dirección arriba; si se ve, `assetlinks.json` no está accesible o la huella no coincide.

El paso 4 va después del 3 a propósito: el botón de la web apunta al APK de *Releases*, que no existe hasta la primera compilación.

## Versiones nuevas

- Cualquier cambio dentro de `app-android/` que subáis compila una versión nueva (el número sube solo: 1.0.1, 1.0.2…).
- Con el archivo ya en `main`, también se puede lanzar a mano: *Actions › App Android › Run workflow*.
- El nombre, los colores y la dirección de inicio están en `app-android/app/build.gradle` (bloque `twaManifest`). Los iconos, en `app-android/app/src/main/res/` (se generaron desde `img/icono-512.png` e `img/icono-maskable-512.png`).
- Los enlaces de correo a `a2wdstudio.com/portal/…` (invitaciones, cambio de contraseña) se abren en la app si está instalada. Los de la web pública se abren en el navegador.

## Google Play

1. En cada compilación, *Actions › (la ejecución) › Artifacts* trae `A2WD.aab`: ese es el archivo que se sube a Play Console.
2. Google vuelve a firmar la app con su propia clave. Copiad la huella SHA-256 de *Play Console › Integridad de la app* y añadidla como segunda línea en `sha256_cert_fingerprints` de `.well-known/assetlinks.json`.
3. Cuando esté publicada, poned el enlace de Google Play en `ANDROID_PLAY` dentro de `instalar.js`: el botón de la web llevará a Google Play en lugar del APK.

El resto del proceso (cuenta, 12 testers durante 14 días, ficha) está en [PLAY-STORE.md](PLAY-STORE.md).

## Si la compilación falla

Si falla, el error de Gradle sale en el resumen de la ejecución (*Actions › App Android › la ejecución › Annotations*), y Claude puede leerlo desde ahí. El registro completo está en el trabajo *compilar* › ⚙ › *View raw logs*.

- 27 oct 2026: la primera compilación falló porque `androidbrowserhelper` 2.7.4 exige Android 7.0 o superior. Se subió `minSdkVersion` de 21 a 24 en `app-android/app/build.gradle`. La app ya no se instala en móviles con Android 5 o 6.

Plan B sin GitHub: [PWABuilder](https://www.pwabuilder.com) › a2wdstudio.com › *Package for stores › Android*, con paquete `com.a2wdstudio.app` y, en la firma, *Use mine* con `a2wd-firma.keystore` y alias `a2wd`. Así la huella sigue siendo la misma y `assetlinks.json` no cambia.
