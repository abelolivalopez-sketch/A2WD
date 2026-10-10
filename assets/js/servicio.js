/* =====================================================================
   PÁGINAS DE SERVICIO (web.html, software-a-medida.html, …)
   ---------------------------------------------------------------------
   - Menú del móvil.
   - Dibujo de la cabecera: solo se anima cuando está en pantalla.
   - «Cómo trabajamos»: la línea de luz recorre los pasos con el scroll
     (igual que las fases de proyectos.html).
   - Tarjetas de «Qué incluye»: un brillo que sigue al ratón y, si se llega
     desde la home con un ancla (web.html#tiendas), esa tarjeta se ilumina.
   Se monta antes que efectos.js (los dos esperan a DOMContentLoaded).
   ===================================================================== */
(function(){
  'use strict';
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hayGsap = !!(window.gsap && window.ScrollTrigger);

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

  /* ---------- dibujos: solo se mueven en pantalla ---------- */
  function visuales(){
    var els = $$('[data-anim]');
    if (!('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('en-vista'); }); return; }
    var io = new IntersectionObserver(function(entradas){
      entradas.forEach(function(en){ en.target.classList.toggle('en-vista', en.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- pasos con línea de luz ---------- */
  function fases(){
    var ruta = $('#ruta');
    if (!ruta) return;
    var eje = $('.ruta-eje', ruta), lista = $$('.fase', ruta);
    if (!hayGsap || reduce) { lista.forEach(function(f){ f.classList.add('activa'); }); return; }
    gsap.fromTo(eje, { '--avance': 0 }, { '--avance': 1, ease: 'none', scrollTrigger: { trigger: ruta, start: 'top 62%', end: 'bottom 62%', scrub: 0.5 } });
    lista.forEach(function(f){
      ScrollTrigger.create({ trigger: f, start: 'top 62%', end: 'bottom 62%', toggleClass: { targets: f, className: 'activa' } });
      gsap.from($('.fase-c', f), { x: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 85%', once: true } });
    });
  }

  /* ---------- tarjetas de «Qué incluye» ---------- */
  function tarjetas(){
    if (fine && !reduce) {
      $$('.sx-item').forEach(function(item){
        var interior = $('.sx-item-in', item);
        item.addEventListener('pointermove', function(ev){
          var r = item.getBoundingClientRect();
          interior.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          interior.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        });
      });
    }
    // Ancla desde la home: se marca la tarjeta (además de :target, por si el
    // scroll suave cambia la posición después de cargar)
    var id = decodeURIComponent((location.hash || '').slice(1));
    var el = id && document.getElementById(id);
    if (el && el.classList.contains('sx-item')) {
      el.classList.add('destacado');
      // Sin animación de entrada en ese bloque: si no, se mide desplazado y el
      // scroll lo deja debajo de la barra superior
      if (el.parentNode) el.parentNode.removeAttribute('data-reveal');
    }
  }

  function montar(){
    if (hayGsap) gsap.registerPlugin(ScrollTrigger);
    menu();
    visuales();
    fases();
    tarjetas();
  }
  document.addEventListener('DOMContentLoaded', montar);
})();
