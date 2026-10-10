/* =====================================================================
   PÁGINA DE MÉTODO Y PROYECTOS (proyectos.html)
   ---------------------------------------------------------------------
   - Menú del móvil.
   - Fases: una línea de luz recorre las cinco fases con el scroll y cada
     fase se ilumina cuando la «nave» llega a ella.
   - Proyectos: se leen de Supabase (los que se publican desde el panel de
     creadores, pestaña «Web»). Si no hay conexión se quedan los dos que
     están escritos en el HTML. Las tarjetas entran desde los lados,
     ligadas al scroll, y se inclinan siguiendo al ratón.
   ===================================================================== */
(function(){
  'use strict';
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hayGsap = !!(window.gsap && window.ScrollTrigger);

  var API = 'https://vsqxcxmsvsektvsceqpx.supabase.co/rest/v1/portfolio?select=titulo,descripcion,url,imagen,etiquetas&publicado=eq.true&order=orden.asc,created_at.desc';
  var CLAVE = 'sb_publishable_W0nqmsiA9O9H3mgBxpQlNQ_UBlMH_kk';   // clave pública por diseño
  var ICONO = '<svg class="flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  var datos = null, triggers = [];

  /* ---------- menú del móvil ---------- */
  function menu(){
    var burger = $('#burgerBtn'), panel = $('#mobileMenu');
    if (!burger || !panel) return;
    function lenis(){ return window.A2WD_fx && window.A2WD_fx.lenis; }
    burger.addEventListener('click', function(){
      var abierto = panel.classList.toggle('open');
      burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      var l = lenis(); if (l) { abierto ? l.stop() : l.start(); }
    });
    $$('a', panel).forEach(function(a){
      a.addEventListener('click', function(){
        panel.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
        var l = lenis(); if (l) l.start();
      });
    });
  }

  /* ---------- fases ---------- */
  function fases(){
    var ruta = $('#ruta'), eje = $('.ruta-eje', ruta), lista = $$('.fase', ruta);
    if (!ruta) return;
    if (!hayGsap || reduce) { lista.forEach(function(f){ f.classList.add('activa'); }); return; }
    gsap.fromTo(eje, { '--avance': 0 }, { '--avance': 1, ease: 'none', scrollTrigger: { trigger: ruta, start: 'top 62%', end: 'bottom 62%', scrub: 0.5 } });
    lista.forEach(function(f){
      ScrollTrigger.create({ trigger: f, start: 'top 62%', end: 'bottom 62%', toggleClass: { targets: f, className: 'activa' } });
      gsap.from($('.fase-c', f), { x: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 85%', once: true } });
    });
  }

  /* ---------- tarjetas de proyectos ---------- */
  function e(x){ return String(x == null ? '' : x).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function seguro(u){ try { var x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch(_) { return ''; } }
  function host(u){ try { return new URL(u).hostname.replace(/^www\./, ''); } catch(_) { return ''; } }
  function t(k){ return window.A2WD_t ? window.A2WD_t(k) : k; }

  function pintar(){
    var grid = $('#portfolioGrid');
    if (!grid || !datos || !datos.length) return;
    var lang = document.documentElement.lang || 'es';
    var etiqueta = t('proy.id1');
    grid.innerHTML = datos.map(function(p, i){
      var n = (i + 1 < 10 ? '0' : '') + (i + 1);
      var desc = (p.descripcion && (p.descripcion[lang] || p.descripcion.es)) || '';
      var img = p.imagen ? seguro(p.imagen) : '';
      var url = p.url ? seguro(p.url) : '';
      return '<article class="mision"><div class="mision-in">' +
        (img ? '<div class="mision-img"><img src="' + e(img) + '" alt="' + e(p.titulo) + '" width="1000" height="457" loading="lazy" decoding="async"></div>' : '') +
        '<div class="mision-cuerpo"><div class="mision-meta mono"><span>' + e(etiqueta.replace(/\d+\s*$/, n)) + '</span><span>' + e(host(url)) + '</span></div>' +
        '<h3>' + e(p.titulo) + '</h3><p>' + e(desc) + '</p>' +
        (p.etiquetas && p.etiquetas.length ? '<div class="chip-row">' + p.etiquetas.map(function(c){ return '<span class="chip">' + e(c) + '</span>'; }).join('') + '</div>' : '') +
        (url ? '<a class="mision-ir" href="' + e(url) + '" target="_blank" rel="noopener" data-magnetic="0.25"><span class="iman-in"><span>' + e(t('proy.repo')) + '</span>' + ICONO + '</span></a>' : '') +
        '</div><span class="mision-brillo" aria-hidden="true"></span></div></article>';
    }).join('');
    animarTarjetas();
  }

  function animarTarjetas(){
    var cards = $$('#portfolioGrid .mision');
    triggers.forEach(function(st){ st.kill(); });
    triggers = [];
    if (window.A2WD_fx && window.A2WD_fx.magnetizar) window.A2WD_fx.magnetizar($('#portfolioGrid'));
    cards.forEach(function(card, i){
      var interior = $('.mision-in', card);
      // inclinación y brillo que siguen al ratón
      if (fine && hayGsap && !reduce) {
        gsap.set(interior, { transformPerspective: 1100 });
        var rx = gsap.quickTo(interior, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        var ry = gsap.quickTo(interior, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        card.addEventListener('pointermove', function(ev){
          var r = card.getBoundingClientRect();
          var px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
          ry((px - 0.5) * 8); rx(-(py - 0.5) * 8);
          interior.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          interior.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        });
        card.addEventListener('pointerleave', function(){ rx(0); ry(0); });
      }
      if (!hayGsap || reduce) return;
      // entrada desde los lados, ligada al scroll
      var lado = i % 2 === 0 ? -1 : 1;          // izquierda, derecha, izquierda…
      var tw = gsap.fromTo(card,
        { xPercent: lado * 70, rotationY: lado * -24, rotation: lado * -4, autoAlpha: 0, transformPerspective: 1200 },
        { xPercent: 0, rotationY: 0, rotation: 0, autoAlpha: 1, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 58%', scrub: 0.8 } });
      triggers.push(tw.scrollTrigger);
    });
    if (hayGsap) ScrollTrigger.refresh();
  }

  function cargar(){
    fetch(API, { headers: { apikey: CLAVE } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if (Array.isArray(d) && d.length) { datos = d; pintar(); } })
      .catch(function(){});
  }

  function montar(){
    if (hayGsap) gsap.registerPlugin(ScrollTrigger);
    menu();
    fases();
    animarTarjetas();     // las dos tarjetas escritas en el HTML
    cargar();             // y, si hay conexión, las del panel
    document.addEventListener('a2wd:idioma', function(){ if (datos) pintar(); });
  }
  document.addEventListener('DOMContentLoaded', montar);
})();
