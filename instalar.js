/* =====================================================================
   App A2WD · instalación en el móvil
   - Registra el service worker (necesario para que sea instalable).
   - Cualquier elemento con  data-instalar  pasa a ser un botón
     "Descargar app": en Android/Chrome abre el instalador nativo,
     en iPhone/iPad muestra los 2 pasos de Safari.
   - Un contenedor con  data-instalar-banner  muestra una tarjeta
     de invitación a instalar (solo si aún no está instalada).
   - Dentro de la app instalada todo esto se oculta solo.
   ===================================================================== */
(function () {
  var script = document.currentScript;
  var base = script ? new URL('.', script.src) : new URL('./', location.href);

  // ---------- Idioma (misma preferencia que la web y el portal) ----------
  var IDIOMAS = ['es', 'fr', 'it', 'en'];
  function idioma() {
    try { var g = localStorage.getItem('a2wd_lang'); if (IDIOMAS.indexOf(g) > -1) return g; } catch (e) {}
    var ls = navigator.languages || [navigator.language || 'es'];
    for (var i = 0; i < ls.length; i++) { var c = String(ls[i]).slice(0, 2).toLowerCase(); if (IDIOMAS.indexOf(c) > -1) return c; }
    return 'es';
  }
  var T = {
    es: {
      boton: 'Descargar app', titulo: 'Instala la app de A2WD',
      sub: 'Tu proyecto y el chat con nosotros, a un toque desde la pantalla de inicio. Sin tiendas ni búsquedas.',
      ios1: 'Pulsa el botón <b>Compartir</b> <span class="a2-ico">⬆︎</span> en la barra de Safari.',
      ios2: 'Elige <b>Añadir a pantalla de inicio</b> y confirma con <b>Añadir</b>.',
      iosSafari: 'En iPhone hay que abrir esta página en <b>Safari</b> para instalarla.',
      otro1: 'Abre el menú del navegador <span class="a2-ico">⋮</span>.',
      otro2: 'Elige <b>Instalar app</b> o <b>Añadir a pantalla de inicio</b>.',
      pc: 'Abre esta página en tu móvil (Chrome en Android o Safari en iPhone) y pulsa «Descargar app».',
      listo: 'Entendido', ok: '¡Listo! Ya tienes A2WD en tu pantalla de inicio.'
    },
    fr: {
      boton: "Télécharger l'app", titulo: "Installez l'app A2WD",
      sub: "Votre projet et la discussion avec nous, en un geste depuis l'écran d'accueil. Sans store ni recherche.",
      ios1: 'Touchez le bouton <b>Partager</b> <span class="a2-ico">⬆︎</span> dans la barre de Safari.',
      ios2: "Choisissez <b>Sur l'écran d'accueil</b> puis <b>Ajouter</b>.",
      iosSafari: "Sur iPhone, ouvrez cette page dans <b>Safari</b> pour l'installer.",
      otro1: 'Ouvrez le menu du navigateur <span class="a2-ico">⋮</span>.',
      otro2: "Choisissez <b>Installer l'application</b> ou <b>Ajouter à l'écran d'accueil</b>.",
      pc: "Ouvrez cette page sur votre mobile (Chrome sur Android ou Safari sur iPhone) et touchez « Télécharger l'app ».",
      listo: "C'est compris", ok: "C'est fait ! A2WD est sur votre écran d'accueil."
    },
    it: {
      boton: "Scarica l'app", titulo: "Installa l'app di A2WD",
      sub: 'Il tuo progetto e la chat con noi, a un tocco dalla schermata Home. Senza store né ricerche.',
      ios1: 'Tocca il pulsante <b>Condividi</b> <span class="a2-ico">⬆︎</span> nella barra di Safari.',
      ios2: 'Scegli <b>Aggiungi alla schermata Home</b> e conferma con <b>Aggiungi</b>.',
      iosSafari: "Su iPhone apri questa pagina in <b>Safari</b> per installarla.",
      otro1: 'Apri il menu del browser <span class="a2-ico">⋮</span>.',
      otro2: "Scegli <b>Installa app</b> o <b>Aggiungi a schermata Home</b>.",
      pc: "Apri questa pagina sul telefono (Chrome su Android o Safari su iPhone) e tocca «Scarica l'app».",
      listo: 'Ho capito', ok: 'Fatto! A2WD è nella tua schermata Home.'
    },
    en: {
      boton: 'Get the app', titulo: 'Install the A2WD app',
      sub: 'Your project and your chat with us, one tap away on your home screen. No app store, no searching.',
      ios1: 'Tap the <b>Share</b> button <span class="a2-ico">⬆︎</span> in Safari’s toolbar.',
      ios2: 'Choose <b>Add to Home Screen</b> and confirm with <b>Add</b>.',
      iosSafari: 'On iPhone, open this page in <b>Safari</b> to install it.',
      otro1: 'Open your browser menu <span class="a2-ico">⋮</span>.',
      otro2: 'Choose <b>Install app</b> or <b>Add to Home screen</b>.',
      pc: 'Open this page on your phone (Chrome on Android or Safari on iPhone) and tap “Get the app”.',
      listo: 'Got it', ok: 'Done! A2WD is now on your home screen.'
    }
  };
  function t(k) { return (T[idioma()] || T.es)[k]; }

  // ---------- Entorno ----------
  var instalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var ua = navigator.userAgent;
  var esIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var esSafariIOS = esIOS && !/CriOS|FxiOS|EdgiOS|GSA|Instagram|FBAN|FBAV/.test(ua);
  var esMovil = esIOS || /Android|Mobi/i.test(ua);
  var avisoNativo = null;

  if ('serviceWorker' in navigator) {
    addEventListener('load', function () {
      navigator.serviceWorker.register(new URL('sw.js', base).href, { scope: base.pathname }).catch(function () {});
    });
  }
  if (instalada) document.documentElement.classList.add('a2-app');

  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); avisoNativo = e; });
  addEventListener('appinstalled', function () {
    avisoNativo = null; ocultarTodo(); aviso(t('ok'));
  });

  // ---------- Estilos (usan los colores de la web, con valores por defecto) ----------
  var css = '' +
    '.a2-app [data-instalar],.a2-app [data-instalar-banner]{display:none!important}' +
    '.a2-banner{border:1px solid var(--line,#E9E9E4);padding:18px 18px 16px;margin-top:28px;display:flex;gap:14px;align-items:flex-start;background:var(--paper,#fff);color:var(--ink,#0B0B0A)}' +
    '.a2-banner img{width:44px;height:44px;border-radius:10px;flex-shrink:0}' +
    '.a2-banner h3{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:14.5px;font-weight:600;margin:0 0 4px}' +
    '.a2-banner p{font-size:13.5px;color:var(--muted,#83837B);margin:0 0 12px;line-height:1.45}' +
    '.a2-banner button{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px;font-weight:500;background:var(--ink,#0B0B0A);color:var(--bg,#fff);border:1px solid var(--ink,#0B0B0A);padding:9px 16px;cursor:pointer;border-radius:2px}' +
    '.a2-velo{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}' +
    '.a2-hoja{background:var(--bg,#fff);color:var(--ink,#0B0B0A);width:100%;max-width:420px;padding:24px 22px 20px;border:1px solid var(--line,#E9E9E4);font-family:"IBM Plex Sans",system-ui,sans-serif;animation:a2sube .25s ease}' +
    '@keyframes a2sube{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}' +
    '.a2-hoja .a2-cab{display:flex;gap:12px;align-items:center;margin-bottom:18px}' +
    '.a2-hoja .a2-cab img{width:40px;height:40px;border-radius:9px}' +
    '.a2-hoja h3{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:15.5px;font-weight:600;margin:0}' +
    '.a2-hoja ol{margin:0 0 20px;padding:0;list-style:none;counter-reset:p}' +
    '.a2-hoja li{counter-increment:p;display:flex;gap:12px;font-size:14.5px;line-height:1.5;padding:10px 0;border-top:1px solid var(--line,#E9E9E4)}' +
    '.a2-hoja li::before{content:counter(p);font-family:"IBM Plex Mono",monospace;font-size:12px;border:1px solid var(--ink,#0B0B0A);width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}' +
    '.a2-hoja p{font-size:14.5px;line-height:1.5;margin:0 0 20px;color:var(--ink-soft,#3A3A37)}' +
    '.a2-hoja button{width:100%;font-family:"IBM Plex Mono",monospace;font-size:13.5px;background:var(--ink,#0B0B0A);color:var(--bg,#fff);border:none;padding:13px;cursor:pointer;border-radius:2px}' +
    '.a2-ico{display:inline-block;font-weight:600}' +
    '.a2-toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:var(--ink,#0B0B0A);color:var(--bg,#fff);font-size:13.5px;padding:12px 18px;z-index:1001;max-width:90vw}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var icono = new URL('img/icono-192.png', base).href;

  // ---------- Acciones ----------
  function instalar(e) {
    if (e) e.preventDefault();
    if (avisoNativo) {
      avisoNativo.prompt();
      avisoNativo.userChoice.finally(function () { avisoNativo = null; });
      return;
    }
    if (esIOS && esSafariIOS) return hoja(paso('ios1', 'ios2'));
    if (esIOS) return hoja('<p>' + t('iosSafari') + '</p>');
    if (esMovil) return hoja(paso('otro1', 'otro2'));
    hoja('<p>' + t('pc') + '</p>');
  }

  function paso(a, b) { return '<ol><li><span>' + t(a) + '</span></li><li><span>' + t(b) + '</span></li></ol>'; }

  function hoja(cuerpo) {
    var velo = document.createElement('div');
    velo.className = 'a2-velo';
    velo.innerHTML = '<div class="a2-hoja" role="dialog" aria-modal="true"><div class="a2-cab"><img src="' + icono + '" alt=""><h3>' +
      t('titulo') + '</h3></div>' + cuerpo + '<button type="button">' + t('listo') + '</button></div>';
    velo.addEventListener('click', function (e) { if (e.target === velo || e.target.tagName === 'BUTTON') velo.remove(); });
    document.body.appendChild(velo);
    velo.querySelector('button').focus();
  }

  function aviso(msg) {
    var el = document.createElement('div'); el.className = 'a2-toast'; el.textContent = msg;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3500);
  }

  function ocultarTodo() { document.documentElement.classList.add('a2-app'); }

  function preparar() {
    if (instalada) return;
    var botones = document.querySelectorAll('[data-instalar]');
    for (var i = 0; i < botones.length; i++) {
      if (!botones[i].textContent.trim()) botones[i].textContent = t('boton');
      botones[i].addEventListener('click', instalar);
    }
    var banners = document.querySelectorAll('[data-instalar-banner]');
    for (var j = 0; j < banners.length; j++) {
      banners[j].innerHTML = '<div class="a2-banner"><img src="' + icono + '" alt=""><div><h3>' + t('titulo') +
        '</h3><p>' + t('sub') + '</p><button type="button">' + t('boton') + '</button></div></div>';
      banners[j].querySelector('button').addEventListener('click', instalar);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', preparar); else preparar();

  window.A2WDApp = { instalar: instalar, instalada: instalada };
})();
