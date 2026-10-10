/* =====================================================================
   EFECTOS COMUNES · index y proyectos
   ---------------------------------------------------------------------
   - Scroll suave con Lenis (solo ratón/trackpad; en táctil, el nativo).
   - Animaciones al entrar en pantalla, con un atributo en el HTML:
       data-reveal               sube y aparece
       data-reveal="desenfoque"  llega borroso y se enfoca
       data-reveal="palabras"    el texto entra palabra a palabra
       data-reveal="escalonado"  los hijos entran uno detrás de otro
       data-reveal="linea"       una línea que se dibuja de izquierda a derecha
   - Cursor propio y botones magnéticos (data-magnetic) en ordenador.
   Quien tenga activado «reducir movimiento» ve todo quieto y sin cursor propio.
   ===================================================================== */
(function(){
  'use strict';
  var mm = function(q){ return window.matchMedia && window.matchMedia(q).matches; };
  var reduce = mm('(prefers-reduced-motion: reduce)');
  var fine = mm('(hover: hover) and (pointer: fine)');
  var root = document.documentElement;
  var hayGsap = !!(window.gsap && window.ScrollTrigger);

  var fx = window.A2WD_fx = {
    reduce: reduce, fine: fine, gsap: hayGsap, lenis: null,
    partir: partir, revelar: revelar, magnetizar: magnetizar,
    refrescar: function(){ if (hayGsap) ScrollTrigger.refresh(); if (window.A2WD_cosmos) window.A2WD_cosmos.medir(); }
  };
  if (!hayGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('fx');
  if (reduce) root.classList.add('fx-quieto');

  /* ---------- scroll suave ---------- */
  var ALTO_NAV = function(){ var n = document.querySelector('header.nav'); return n ? n.offsetHeight : 80; };
  if (!reduce && window.Lenis) {
    // anchors: Lenis ya respeta el scroll-padding-top del CSS (altura de la barra)
    var lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, anchors: true, stopInertiaOnNavigate: true });
    fx.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.addEventListener('refresh', function(){ lenis.resize(); });
    gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    root.classList.add('lenis-activo');
  }
  // Llegar desde otra página a index.html#seccion: tras montar las animaciones
  // (que cambian la altura de la página) se vuelve a colocar en su sitio.
  function irAlAncla(){
    var h = location.hash;
    if (!h || h.length < 2) return;
    var el = document.getElementById(decodeURIComponent(h.slice(1)));
    if (!el) return;
    var pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || ALTO_NAV();
    var y = el.getBoundingClientRect().top + window.scrollY - pad;
    // Lenis guarda la altura de la página: se actualiza antes (las secciones fijadas la alargan)
    if (fx.lenis) { fx.lenis.resize(); fx.lenis.scrollTo(y, { immediate: true, force: true }); } else window.scrollTo(0, y);
  }

  /* ---------- partir en palabras ---------- */
  // Cada palabra queda en <span class="w" style="--i:n">. La animación mueve
  // una sola variable (--p) en el elemento: así, si el idioma cambia y el texto
  // se reescribe, basta con volver a partirlo y la animación sigue valiendo.
  function partir(el){
    var n = 0;
    (function recorrer(nodo){
      Array.prototype.slice.call(nodo.childNodes).forEach(function(h){
        if (h.nodeType === 3) {
          // Solo se corta en espacios normales: el espacio duro (\u00a0) une palabras
          // que no deben separarse, como «objectif ?» en francés.
          var trozos = h.textContent.split(/([ \t\n\r\f]+)/);
          if (trozos.length === 1 && !trozos[0]) return;
          var frag = document.createDocumentFragment();
          trozos.forEach(function(tr){
            if (!tr) return;
            if (/^[ \t\n\r\f]+$/.test(tr)) { frag.appendChild(document.createTextNode(tr)); return; }
            var s = document.createElement('span');
            s.className = 'w'; s.textContent = tr; s.style.setProperty('--i', n++);
            frag.appendChild(s);
          });
          nodo.replaceChild(frag, h);
        } else if (h.nodeType === 1 && h.tagName !== 'BR' && !h.classList.contains('w')) {
          recorrer(h);
        }
      });
    })(el);
    el.style.setProperty('--n', n);
    el.classList.add('partido');
    return n;
  }
  document.addEventListener('a2wd:idioma', function(){
    document.querySelectorAll('.partido').forEach(partir);
    requestAnimationFrame(function(){ ScrollTrigger.refresh(); });
  });

  /* ---------- aparecer al entrar en pantalla ---------- */
  function revelar(ambito){
    (ambito || document).querySelectorAll('[data-reveal]:not([data-revelado])').forEach(function(el){
      el.setAttribute('data-revelado', '');
      var tipo = el.getAttribute('data-reveal') || 'sube';
      if (tipo === 'palabras') partir(el);
      if (reduce) return;
      var st = { trigger: el, start: el.getAttribute('data-reveal-start') || 'top 88%', once: true };
      var retraso = parseFloat(el.getAttribute('data-reveal-delay') || '0');
      if (tipo === 'palabras') {
        gsap.fromTo(el, { '--p': 0 }, { '--p': 1, duration: 1.5, ease: 'power2.out', delay: retraso, scrollTrigger: st, onComplete: function(){ el.classList.add('listo'); } });
      } else if (tipo === 'desenfoque') {
        gsap.from(el, { autoAlpha: 0, filter: 'blur(14px)', scale: 1.04, duration: 1.3, ease: 'power3.out', delay: retraso, scrollTrigger: st, clearProps: 'filter,transform' });
      } else if (tipo === 'escalonado') {
        gsap.from(el.children, { autoAlpha: 0, y: 46, duration: 1.05, ease: 'expo.out', stagger: 0.11, delay: retraso, scrollTrigger: st, clearProps: 'transform' });
      } else if (tipo === 'linea') {
        gsap.from(el, { scaleX: 0, transformOrigin: '0 50%', duration: 1.4, ease: 'expo.inOut', delay: retraso, scrollTrigger: st });
      } else {
        gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.1, ease: 'expo.out', delay: retraso, scrollTrigger: st, clearProps: 'transform' });
      }
    });
  }

  /* ---------- barras de sección: la línea se dibuja y entran los textos ---------- */
  function barras(){
    if (reduce) return;
    document.querySelectorAll('.sec-bar').forEach(function(b){
      gsap.timeline({ scrollTrigger: { trigger: b, start: 'top 92%', once: true } })
        .fromTo(b, { '--l': 0 }, { '--l': 1, duration: 1.4, ease: 'expo.inOut' })
        .from(b.children, { autoAlpha: 0, y: 10, duration: 0.8, ease: 'expo.out', stagger: 0.12 }, 0.25);
    });
  }

  /* ---------- botones magnéticos ---------- */
  function magnetizar(ambito){
    if (!fine || reduce) return;
    (ambito || document).querySelectorAll('[data-magnetic]:not([data-iman])').forEach(function(el){
      el.setAttribute('data-iman', '');
      var fuerza = parseFloat(el.getAttribute('data-magnetic')) || 0.32;
      var interior = el.querySelector('.iman-in');
      var qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      var qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      var ix = interior && gsap.quickTo(interior, 'x', { duration: 0.6, ease: 'power3.out' });
      var iy = interior && gsap.quickTo(interior, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        qx(x * fuerza); qy(y * fuerza);
        if (ix) { ix(x * fuerza * 0.5); iy(y * fuerza * 0.5); }
      });
      el.addEventListener('pointerleave', function(){
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
        if (interior) gsap.to(interior, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }

  /* ---------- cursor propio ---------- */
  function cursor(){
    if (!fine || reduce) return;
    var c = document.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span class="cursor-anillo"><span class="cursor-txt"></span></span><span class="cursor-punto"></span>';
    document.body.appendChild(c);
    var anillo = c.firstChild, punto = c.lastChild, txt = anillo.firstChild;
    var ax = gsap.quickTo(anillo, 'x', { duration: 0.45, ease: 'power3.out' });
    var ay = gsap.quickTo(anillo, 'y', { duration: 0.45, ease: 'power3.out' });
    var px = gsap.quickTo(punto, 'x', { duration: 0.08, ease: 'none' });
    var py = gsap.quickTo(punto, 'y', { duration: 0.08, ease: 'none' });
    root.classList.add('con-cursor');
    window.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      c.classList.add('visible');
      ax(e.clientX); ay(e.clientY); px(e.clientX); py(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerleave', function(){ c.classList.remove('visible'); });
    document.addEventListener('pointerover', function(e){
      var t = e.target;
      var campo = t.closest('input,textarea,select,[contenteditable]');
      var activo = !campo && t.closest('a,button,[role="button"],[data-cursor],label,summary');
      c.classList.toggle('sobre-campo', !!campo);
      c.classList.toggle('sobre-enlace', !!activo);
      c.classList.toggle('sobre-foto', !!t.closest('.trip-card,.mision-img,[data-cursor-foto]'));   // sin anillo encima de las fotos
      var etiqueta = activo && activo.getAttribute('data-cursor');
      txt.textContent = etiqueta || '';
      c.classList.toggle('con-texto', !!etiqueta);
    });
    document.addEventListener('pointerdown', function(){ c.classList.add('pulsado'); });
    document.addEventListener('pointerup', function(){ c.classList.remove('pulsado'); });
  }

  /* ---------- arranque ---------- */
  function arrancar(){
    barras();
    revelar();
    magnetizar();
    cursor();
    document.dispatchEvent(new CustomEvent('a2wd:fx-listo'));
    if ('scrollRestoration' in history && location.hash) history.scrollRestoration = 'manual';
    var listo = function(){ ScrollTrigger.sort(); ScrollTrigger.refresh(); irAlAncla(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(listo); else listo();
    // Con todo cargado (imágenes incluidas) las alturas ya son las definitivas
    var alCargar = function(){ ScrollTrigger.refresh(); setTimeout(irAlAncla, 80); };
    if (document.readyState === 'complete') alCargar(); else window.addEventListener('load', alCargar);
  }
  // Espera a DOMContentLoaded para que los scripts de cada página (home.js,
  // proyectos.js) monten antes sus secciones fijadas.
  if (document.readyState === 'complete') arrancar(); else document.addEventListener('DOMContentLoaded', arrancar);
})();
