/* =====================================================================
   HOME · coreografía de las secciones de index.html
   ---------------------------------------------------------------------
   1. Hero: letras de A2WD, la Möbius se difumina, la primera frase aparece
      al entrar y la segunda en el siguiente scroll (sección fijada).
   2. Servicios: la pantalla 1 se fija mientras se carga la barra de luz.
   3. Dibujos de las tarjetas: solo se animan cuando están en pantalla.
   4. Cómo trabajamos: el plano se dibuja con el scroll.
   5. Nosotros: tarjetas que entran escalonadas y panel que cambia de persona.
   Se monta antes que efectos.js (DOMContentLoaded) para que las secciones
   fijadas existan cuando se calculen el resto de posiciones.
   ===================================================================== */
(function(){
  'use strict';
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hayGsap = !!(window.gsap && window.ScrollTrigger);

  function montar(){
    var fx = window.A2WD_fx || {};
    visuales();
    nosotros(fx);
    if (!hayGsap) { servicios(null); return; }
    gsap.registerPlugin(ScrollTrigger);
    hero(fx);
    servicios(fx);
    metodo();
    entradaNosotros();
  }

  /* ---------- 1. HERO ---------- */
  function hero(fx){
    var l1 = $('.hero-l1'), l2 = $('.hero-l2'), foot = $('.hero-foot');
    if (fx.partir) { fx.partir(l1); fx.partir(l2); }
    if (reduce) return;

    // Entrada: letras de A2WD y Möbius
    gsap.from('.hero-brand-name span', { autoAlpha: 0, yPercent: 40, filter: 'blur(14px)', duration: 1.7, ease: 'expo.out', stagger: 0.09, delay: 0.15, clearProps: 'filter' });
    gsap.from('#mobiusContainer', { autoAlpha: 0, scale: 0.9, duration: 2.4, ease: 'power3.out' });
    gsap.from('.hero-scroll-cue', { autoAlpha: 0, y: 12, duration: 1, delay: 1.1 });

    // Al bajar: el logotipo se aleja y la Möbius se difumina
    gsap.timeline({ scrollTrigger: { trigger: '#heroIntro', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-brand-center', { yPercent: -35, scale: 0.84, autoAlpha: 0, filter: 'blur(10px)', ease: 'none' }, 0)
      .to('.hero-scroll-cue', { autoAlpha: 0, ease: 'none', duration: 0.3 }, 0)
      .fromTo('.hero-mobius', { opacity: 1, filter: 'blur(0px)' }, { opacity: 0.5, filter: 'blur(6px)', ease: 'none' }, 0);

    // Frase 1: aparece mientras el mensaje entra en pantalla
    gsap.set([l1, l2], { '--p': 0 });
    gsap.set(foot, { autoAlpha: 0, y: 18 });
    gsap.to(l1, { '--p': 1, ease: 'none', scrollTrigger: { trigger: '#heroMensaje', start: 'top 80%', end: 'top 12%', scrub: 0.6 } });

    // Frase 2: el mensaje se queda fijo y aparece en el siguiente scroll
    gsap.timeline({ scrollTrigger: { trigger: '#heroMensaje', start: 'top top', end: '+=120%', pin: true, scrub: 0.6, anticipatePin: 1 } })
      .to(l2, { '--p': 1, ease: 'none', duration: 0.5 }, 0.08)
      .to(foot, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.18 }, 0.55)
      .fromTo('.hero-mobius', { opacity: 0.5 }, { opacity: 0, ease: 'none', duration: 0.3, immediateRender: false }, 0.7)
      .to({}, { duration: 0.1 });
  }

  /* ---------- 2. SERVICIOS: barra de luz ---------- */
  function servicios(fx){
    var intro = $('#svIntro'), carga = $('#svCarga');
    if (!intro || !carga) return;
    var barra = $('.carga-barra', carga), pct = $('.carga-pct', carga), hitos = $$('#svHitos li');
    var umbrales = [0.12, 0.45, 0.78];
    function pintar(p){
      barra.style.setProperty('--carga', p.toFixed(4));
      pct.textContent = ('00' + Math.round(p * 100)).slice(-3) + '%';
      hitos.forEach(function(li, i){ li.classList.toggle('on', p >= umbrales[i]); });
      carga.classList.toggle('listo', p >= 0.995);
    }
    if (!fx || reduce) { pintar(1); return; }
    pintar(0);
    var mm = gsap.matchMedia();
    // Pantallas con sitio: la sección se fija una pantalla mientras se carga
    mm.add('(min-width: 761px) and (min-height: 600px)', function(){
      ScrollTrigger.create({ trigger: intro, start: 'top top', end: '+=100%', pin: true, scrub: true, anticipatePin: 1, onUpdate: function(s){ pintar(s.progress); } });
    });
    // Móvil y pantallas bajas: se carga mientras se recorre la sección
    mm.add('(max-width: 760px), (max-height: 599px)', function(){
      ScrollTrigger.create({ trigger: intro, start: 'top 55%', end: 'bottom 85%', scrub: true, onUpdate: function(s){ pintar(s.progress); } });
    });
    // Entrada de los hitos y la barra
    gsap.from('.sv-carga', { autoAlpha: 0, y: 20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: intro, start: 'top 70%', once: true } });
  }

  /* ---------- 3. Dibujos animados: solo en pantalla ---------- */
  function visuales(){
    var els = $$('[data-anim]');
    if (!('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('en-vista'); }); return; }
    var io = new IntersectionObserver(function(entradas){
      entradas.forEach(function(en){ en.target.classList.toggle('en-vista', en.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- 4. CÓMO TRABAJAMOS: el plano se dibuja ---------- */
  function metodo(){
    var plano = $('#plano');
    if (!plano || reduce) return;
    var trazos = $$('.trazo:not(.eje)', plano);
    trazos.forEach(function(t){
      var L = 600;
      try { L = Math.ceil(t.getTotalLength()) + 2; } catch(e){}
      t.style.strokeDasharray = L + ' ' + L;
      t.style.strokeDashoffset = L;
    });
    var tl = gsap.timeline({ scrollTrigger: { trigger: plano, start: 'top 85%', end: 'bottom 55%', scrub: 0.8 } });
    tl.to(trazos, { strokeDashoffset: 0, ease: 'none', duration: 0.5, stagger: 0.035 }, 0)
      .from($$('.eje', plano), { opacity: 0, duration: 0.2 }, 0.35)
      .from($$('text', plano), { opacity: 0, y: 6, duration: 0.15, stagger: 0.03 }, 0.55);
  }

  /* ---------- 5. NOSOTROS ---------- */
  function nosotros(fx){
    var caja = $('#tripulacion');
    if (!caja) return;
    var cards = $$('.trip-card', caja);
    var puntos = { abel: $('.p-abel', caja), ariel: $('.p-ariel', caja) };
    var panel = $('#tripPanel'), nombre = $('#tripNombre'), rol = $('#tripRol'), bio = $('#tripBio');
    var actual = 'abel';
    function datos(){
      var card = cards.filter(function(c){ return c.getAttribute('data-persona') === actual; })[0];
      var d = $('.trip-datos', card);
      nombre.textContent = $('.d-nombre', d).textContent;
      rol.textContent = $('.d-rol', d).textContent;
      bio.textContent = $('.d-bio', d).textContent;
    }
    function elegir(quien, animar){
      if (quien === actual && animar) return;
      actual = quien;
      caja.setAttribute('data-activo', quien);
      cards.forEach(function(c){
        var on = c.getAttribute('data-persona') === quien;
        c.classList.toggle('activa', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      Object.keys(puntos).forEach(function(k){ if (puntos[k]) puntos[k].classList.toggle('activo', k === quien); });
      if (animar && hayGsap && !reduce) {
        var hijos = panel.children;
        gsap.killTweensOf(hijos);
        gsap.to(hijos, { autoAlpha: 0, y: -8, duration: 0.16, ease: 'power2.in', onComplete: function(){
          datos();
          gsap.fromTo(hijos, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.06 });
        } });
      } else {
        datos();
      }
    }
    cards.forEach(function(c){
      var quien = c.getAttribute('data-persona');
      c.addEventListener('click', function(){ elegir(quien, true); });
      if (fine) c.addEventListener('pointerenter', function(){ elegir(quien, true); });
      // inclinación 3D que sigue al ratón
      if (fine && hayGsap && !reduce) {
        var rx = gsap.quickTo(c, 'rotationX', { duration: 0.6, ease: 'power3.out' });
        var ry = gsap.quickTo(c, 'rotationY', { duration: 0.6, ease: 'power3.out' });
        gsap.set(c, { transformPerspective: 900 });
        c.addEventListener('pointermove', function(e){
          var r = c.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 9);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 9);
        });
        c.addEventListener('pointerleave', function(){ rx(0); ry(0); });
      }
    });
    document.addEventListener('a2wd:idioma', function(){ datos(); });
    datos();
  }
  function entradaNosotros(){
    if (reduce || !$('#tripulacion')) return;
    var inf = $('.inf-trazo'), L = 260;
    try { L = Math.ceil(inf.getTotalLength()) + 2; } catch(e){}
    inf.style.strokeDasharray = L + ' ' + L;
    gsap.timeline({ scrollTrigger: { trigger: '#tripulacion', start: 'top 80%', once: true } })
      .from('.trip-card', { autoAlpha: 0, y: 70, rotation: function(i){ return i ? 3 : -3; }, duration: 1.2, ease: 'expo.out', stagger: 0.2 })
      .fromTo(inf, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0.25)
      .fromTo('.trip-linea', { '--l': 0 }, { '--l': 1, duration: 1.1, ease: 'expo.inOut' }, 0.3)
      .from('.trip-punto', { scale: 0, duration: 0.5, stagger: 0.12, ease: 'back.out(3)', clearProps: 'transform' }, 0.7)
      .from('.trip-orbitas', { autoAlpha: 0, scale: 0.92, duration: 1.6, ease: 'power3.out' }, 0)
      .from('.trip-dato-izq', { autoAlpha: 0, x: -30, duration: 1, ease: 'expo.out', clearProps: 'opacity,visibility,transform' }, 0.5)
      .from('.trip-dato-der', { autoAlpha: 0, x: 30, duration: 1, ease: 'expo.out', clearProps: 'opacity,visibility,transform' }, 0.6)
      .from('#tripPanel', { autoAlpha: 0, y: 30, duration: 1, ease: 'expo.out' }, 0.6);
  }

  document.addEventListener('DOMContentLoaded', montar);
})();
