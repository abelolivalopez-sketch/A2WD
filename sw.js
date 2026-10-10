// =====================================================================
//  Service worker de la app A2WD
//  - Hace que la web se pueda instalar como app en el móvil.
//  - Guarda la "carcasa" del portal (y la librería de Supabase y las
//    fuentes) para que la app abra rápido y también SIN CONEXIÓN.
//  - Los datos del cliente no pasan por aquí: los guarda portal/movil.js.
//  - Recibe las notificaciones push y abre la app al tocarlas.
//  Al cambiar archivos del portal, sube el número de VERSION.
// =====================================================================
const VERSION = 'a2wd-v21';
const CARCASA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './instalar.js',
  './tarifas.js',
  './img/favicon.svg',
  './img/icono-192.png',
  './img/icono-512.png',
  './portal/login.html',
  './portal/cliente.html',
  './portal/creador.html',
  './portal/portal.css',
  './portal/js/app.js',
  './portal/js/i18n.js',
  './portal/js/config.js',
  './portal/js/movil.js',
  './fonts/fonts.css',
];

// Librería de Supabase (sus piezas internas se guardan en la siguiente visita)
const LIBRERIAS = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await c.addAll(CARCASA);
    await Promise.all(LIBRERIAS.map((u) => c.add(new Request(u, { mode: 'cors' })).catch(() => {})));
  }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Librería de Supabase (jsDelivr): se guarda para usarla sin conexión. Las fuentes ya son locales.
  const externo = url.hostname === 'cdn.jsdelivr.net';
  // Supabase (datos, sesión) y cualquier otro sitio van siempre directos a la red
  if (url.origin !== self.location.origin && !externo) return;

  // Páginas: primero la red (siempre lo último), si no hay conexión la copia guardada
  if (req.mode === 'navigate') {
    // (una petición de navegación no se puede copiar con opciones: se pide por su URL)
    e.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => { guardar(req, res.clone()); return res; })
        .catch(async () =>
          (await caches.match(req, { ignoreSearch: true })) ||
          (await caches.match('./portal/login.html')))
    );
    return;
  }

  // Archivos de la web (js, css, imágenes): primero la red para que página y código
  // sean siempre de la misma versión; sin conexión, la copia guardada
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => { guardar(req, res.clone()); return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Librerías y fuentes externas: copia guardada al instante y se actualiza por detrás
  e.respondWith(
    caches.match(req).then((guardada) => {
      const red = fetch(req).then((res) => { guardar(req, res.clone()); return res; }).catch(() => guardada);
      return guardada || red;
    })
  );
});

function guardar(req, res) {
  if (res && (res.ok || res.type === 'opaque')) caches.open(VERSION).then((c) => c.put(req, res));
}

// ---------- Notificaciones push ----------
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const url = new URL(d.url || 'portal/cliente.html', self.registration.scope).href;
  e.waitUntil(self.registration.showNotification(d.title || 'A2WD', {
    body: d.body || '',
    icon: new URL('img/icono-192.png', self.registration.scope).href,
    badge: new URL('img/icono-192.png', self.registration.scope).href,
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = e.notification.data?.url || self.registration.scope;
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abiertas) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) {
        await c.navigate(destino).catch(() => {});
        return c.focus();
      }
    }
    return self.clients.openWindow(destino);
  })());
});
