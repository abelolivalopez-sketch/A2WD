// =====================================================================
//  Service worker de la app A2WD
//  - Hace que la web se pueda instalar como app en el móvil.
//  - Guarda la "carcasa" del portal para que abra rápido y sin conexión.
//  - Nunca guarda datos de Supabase (proyectos, mensajes…): siempre en vivo.
//  Al cambiar archivos del portal, sube el número de VERSION.
// =====================================================================
const VERSION = 'a2wd-v1';
const CARCASA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './instalar.js',
  './img/favicon.svg',
  './img/icono-192.png',
  './img/icono-512.png',
  './portal/login.html',
  './portal/cliente.html',
  './portal/creador.html',
  './portal/portal.css',
  './portal/app.js',
  './portal/i18n.js',
  './portal/config.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CARCASA)).then(() => self.skipWaiting()));
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
  // Solo archivos de esta web; Supabase, fuentes y CDN van directos a la red
  if (url.origin !== self.location.origin) return;

  // Páginas: primero la red (siempre lo último), si no hay conexión la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { guardar(req, res.clone()); return res; })
        .catch(async () =>
          (await caches.match(req, { ignoreSearch: true })) ||
          (await caches.match('./portal/login.html')))
    );
    return;
  }

  // Resto (css, js, imágenes): copia guardada al instante y se actualiza por detrás
  e.respondWith(
    caches.match(req).then((guardada) => {
      const red = fetch(req).then((res) => { guardar(req, res.clone()); return res; }).catch(() => guardada);
      return guardada || red;
    })
  );
});

function guardar(req, res) {
  if (res && res.ok && res.type === 'basic') caches.open(VERSION).then((c) => c.put(req, res));
}
