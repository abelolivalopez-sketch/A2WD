/* =====================================================================
   COSMOS · fondo espacial de la web pública (index y proyectos)
   ---------------------------------------------------------------------
   Un solo <canvas id="cosmos"> fijo detrás de todo el contenido:
   - Estrellas en tres profundidades que se desplazan a distinta velocidad
     con el scroll y con el ratón (efecto de profundidad entre capas).
   - En el hero hay muchas estrellas, nebulosa y un planeta con anillo.
   - Al salir del hero las estrellas «se van hacia arriba» como un salto a
     la velocidad de la luz y quedan menos: cuanto más se baja, más oscuro.
   - Cometas de vez en cuando (más a menudo en el hero) y uno extra al
     hacer clic en una zona vacía de la página.
   - Cerca del ratón las estrellas se unen con líneas finas (constelación).
   Ajustes de la página (atributos en <body>):
     data-cosmos-oscuro="0.45"  oscuridad inicial (la home empieza en 0)
   Respeta «reducir movimiento» y el modo ahorro de datos: entonces se
   dibuja un cielo quieto que solo cambia de densidad al hacer scroll.
   ===================================================================== */
(function(){
  'use strict';
  var cv = document.getElementById('cosmos');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d', { alpha: false });
  if (!ctx) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ahorro = !!(navigator.connection && navigator.connection.saveData);
  var quieto = reduce || ahorro;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  var heroEl = document.querySelector('[data-cosmos-hero]');
  var oscuroBase = parseFloat(document.body.getAttribute('data-cosmos-oscuro') || '0') || 0;

  var DPR = 1, W = 0, H = 0, docH = 0, heroEnd = 0;
  var stars = [], comets = [];
  var nebula = null, planet = null, planetR = 0;
  var offset = 0, lastY = window.scrollY, vel = 0;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, active: false };
  var nextComet = 0, running = true, lastT = 0;

  var COLORS = ['#ffffff', '#dce8ff', '#bcd2ff', '#ffe9d2'];

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function smooth(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b){ return a + Math.random() * (b - a); }

  /* ---------- medidas ---------- */
  function medir(){
    var w = cv.clientWidth || window.innerWidth;
    var h = cv.clientHeight || window.innerHeight;
    var cambioAncho = Math.abs(w - W) > 1;
    // En el móvil la barra del navegador cambia la altura al hacer scroll:
    // solo se rehace el cielo si cambia el ancho o la altura crece bastante.
    if (!cambioAncho && h <= H + 120 && stars.length) { medirPagina(); return; }
    W = w; H = h;
    DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 2 : 1.5);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    crearEstrellas();
    crearNebulosa();
    crearPlaneta();
    medirPagina();
    if (quieto) pedirDibujo();
  }
  function medirPagina(){
    docH = Math.max(document.documentElement.scrollHeight, H + 1);
    heroEnd = 0;
    if (heroEl) {
      var r = heroEl.getBoundingClientRect();
      heroEnd = r.top + window.scrollY + r.height;
    }
  }

  /* ---------- estrellas ---------- */
  function crearEstrellas(){
    var n = Math.round(clamp(W * H / 820, 320, 2300));
    stars = new Array(n);
    for (var i = 0; i < n; i++) {
      var z = Math.pow(Math.random(), 1.7);                 // más estrellas lejanas que cercanas
      var r = 0.35 + z * 1.25 + (Math.random() < 0.025 ? 0.9 : 0);
      var c = Math.random();
      stars[i] = {
        x: Math.random() * W, y: Math.random() * H, z: z, r: r,
        a: 0.35 + Math.random() * 0.65,
        tw: Math.random() * 6.283, ts: 0.4 + Math.random() * 1.6,
        k: Math.random(),                                       // umbral de densidad
        c: c < 0.62 ? 0 : c < 0.84 ? 1 : c < 0.95 ? 2 : 3
      };
    }
  }

  /* ---------- nebulosa (se pinta una vez) ---------- */
  function crearNebulosa(){
    var w = Math.round(W * 1.2), h = Math.round(H * 1.3);
    var off = document.createElement('canvas');
    var s = 0.5;                                               // a media resolución: es difusa
    off.width = Math.max(2, Math.round(w * s)); off.height = Math.max(2, Math.round(h * s));
    var c = off.getContext('2d');
    c.scale(s, s);
    function mancha(x, y, rad, color, alfa){
      var g = c.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(' + color + ',' + alfa + ')');
      g.addColorStop(0.45, 'rgba(' + color + ',' + (alfa * 0.42) + ')');
      g.addColorStop(1, 'rgba(' + color + ',0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    var m = Math.max(w, h);
    mancha(w * 0.74, h * 0.18, m * 0.42, '92,116,176', 0.22);
    mancha(w * 0.18, h * 0.72, m * 0.38, '112,74,150', 0.17);
    mancha(w * 0.52, h * 0.46, m * 0.30, '70,104,150', 0.08);
    mancha(w * 0.92, h * 0.86, m * 0.26, '58,98,128', 0.09);
    nebula = { img: off, w: w, h: h };
  }

  /* ---------- planeta con anillo (se pinta una vez) ---------- */
  function crearPlaneta(){
    planetR = Math.round(clamp(Math.min(W, H) * (W < 700 ? 0.24 : 0.165), 64, 180));
    var R = planetR, pad = R * 1.25, size = Math.ceil((R + pad) * 2);
    var off = document.createElement('canvas');
    var dpr = Math.min(DPR, 1.5);
    off.width = Math.ceil(size * dpr); off.height = Math.ceil(size * dpr);
    var c = off.getContext('2d');
    c.scale(dpr, dpr);
    var cx = size / 2, cy = size / 2;
    var tilt = -0.32;

    function anillo(desde, hasta){
      c.save();
      c.translate(cx, cy); c.rotate(tilt);
      for (var i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(0, 0, R * (1.55 + i * 0.13), R * (0.36 + i * 0.03), 0, desde, hasta);
        c.strokeStyle = 'rgba(190,210,245,' + (0.16 - i * 0.04) + ')';
        c.lineWidth = R * (0.05 - i * 0.012);
        c.stroke();
      }
      c.restore();
    }
    // halo de atmósfera
    var halo = c.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.45);
    halo.addColorStop(0, 'rgba(120,160,255,0.20)');
    halo.addColorStop(1, 'rgba(120,160,255,0)');
    c.fillStyle = halo; c.fillRect(0, 0, size, size);
    // mitad trasera del anillo
    anillo(Math.PI, Math.PI * 2);
    // cuerpo del planeta
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
    var g = c.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.05, cx, cy, R * 1.05);
    g.addColorStop(0, '#5d6c8f');
    g.addColorStop(0.35, '#2c3550');
    g.addColorStop(0.75, '#121729');
    g.addColorStop(1, '#070910');
    c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    // bandas suaves de gas
    c.globalCompositeOperation = 'soft-light';
    for (var b = 0; b < 7; b++) {
      var y = cy - R + (b + 0.5) * (2 * R / 7) + rnd(-R * 0.05, R * 0.05);
      c.beginPath();
      c.ellipse(cx, y, R * 1.2, R * rnd(0.04, 0.09), tilt * 0.5, 0, Math.PI * 2);
      c.fillStyle = b % 2 ? 'rgba(170,190,235,0.35)' : 'rgba(20,26,48,0.45)';
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // sombra del lado nocturno
    var sombra = c.createRadialGradient(cx + R * 0.55, cy + R * 0.6, R * 0.1, cx + R * 0.3, cy + R * 0.35, R * 1.25);
    sombra.addColorStop(0, 'rgba(3,4,8,0.92)');
    sombra.addColorStop(0.6, 'rgba(3,4,8,0.55)');
    sombra.addColorStop(1, 'rgba(3,4,8,0)');
    c.fillStyle = sombra; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.restore();
    // borde iluminado
    c.beginPath(); c.arc(cx, cy, R - 0.5, Math.PI * 0.95, Math.PI * 1.75);
    c.strokeStyle = 'rgba(180,205,255,0.55)'; c.lineWidth = 1.2; c.stroke();
    // mitad delantera del anillo
    anillo(0, Math.PI);
    planet = { img: off, size: size };
  }

  /* ---------- profundidad según el scroll ---------- */
  // 0 = cielo del hero (denso) · 1 = final de la página (oscuro y con pocas estrellas)
  function profundidad(y){
    if (!heroEl) return clamp(oscuroBase + (1 - oscuroBase) * (y / Math.max(1, docH - H)), 0, 1);
    var z0 = heroEnd - H * 1.15, z1 = heroEnd - H * 0.15;
    if (y <= z0) return 0;
    if (y < z1) return 0.5 * smooth((y - z0) / (z1 - z0));
    return 0.5 + 0.5 * clamp((y - z1) / Math.max(1, docH - H - z1), 0, 1);
  }
  // salto (warp): campana alrededor del final del hero
  function salto(y){
    if (!heroEl) return 0;
    var t = (y - (heroEnd - H * 1.35)) / (H * 1.1);
    if (t <= 0 || t >= 1) return 0;
    return Math.sin(Math.PI * t);
  }
  function densidad(d){
    return d < 0.5 ? lerp(1, 0.4, d / 0.5) : lerp(0.4, 0.22, (d - 0.5) / 0.5);
  }

  /* ---------- cometas ---------- */
  // dirX = -1 cae hacia la izquierda, 1 hacia la derecha
  function lanzarCometa(x, y, dirX){
    var th = rnd(14, 38) * Math.PI / 180;
    if (x == null) {
      x = dirX < 0 ? rnd(W * 0.45, W * 1.05) : rnd(-W * 0.05, W * 0.55);
      y = rnd(-H * 0.05, H * 0.35);
    }
    if (comets.length > 6) comets.shift();
    comets.push({
      x: x, y: y, vx: Math.cos(th) * dirX, vy: Math.sin(th),
      sp: rnd(0.7, 1.25), len: rnd(130, 280), life: 0, max: rnd(1100, 1700), w: rnd(1, 1.8)
    });
  }

  /* ---------- dibujo ---------- */
  var colorFondoA = [5, 6, 12], colorFondoB = [2, 2, 5];
  function dibujar(t, dt){
    var y = window.scrollY;
    var dy = y - lastY; lastY = y;
    if (Math.abs(dy) > H * 1.5) dy = 0;                       // saltos por anclas: sin estela gigante
    var d = profundidad(y);
    var w = quieto ? 0 : salto(y);
    var gain = 1 + w * 7;
    if (!quieto) offset += dy * gain;
    vel = vel * 0.82 + (quieto ? 0 : dy * gain) * 0.18;

    // ratón suavizado
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    // fondo
    var fc = [
      Math.round(lerp(colorFondoA[0], colorFondoB[0], d)),
      Math.round(lerp(colorFondoA[1], colorFondoB[1], d)),
      Math.round(lerp(colorFondoA[2], colorFondoB[2], d))
    ];
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgb(' + fc[0] + ',' + fc[1] + ',' + fc[2] + ')';
    ctx.fillRect(0, 0, W, H);

    // nebulosa
    var na = clamp(1 - d * 1.5, 0.16, 1);
    if (nebula) {
      ctx.globalAlpha = na;
      var nx = -W * 0.1 - mouse.x * 14, ny = -H * 0.15 - (quieto ? 0 : offset * 0.04) % (H * 0.3) - mouse.y * 10;
      ctx.drawImage(nebula.img, nx, ny, nebula.w, nebula.h);
    }

    // planeta (solo alrededor del hero)
    var pa = heroEl ? clamp(1 - d * 3.2, 0, 1) : 0;
    if (planet && pa > 0.01) {
      var px = W * (W < 700 ? 0.9 : 0.87) - mouse.x * 22;
      var py = H * (W < 700 ? 0.12 : 0.2) - y * 0.22 - mouse.y * 16;
      ctx.globalAlpha = pa * 0.72;
      ctx.drawImage(planet.img, px - planet.size / 2, py - planet.size / 2, planet.size, planet.size);
    }

    // estrellas
    var dens = densidad(d);
    var brillo = lerp(1, 0.85, d) + w * 0.35;
    var mx = mouse.x, my = mouse.y;
    var cercanas = [];
    var lineas = Math.abs(vel) > 0.6;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var vis = clamp((dens - s.k) * 9, 0, 1);
      if (vis <= 0) continue;
      var sp = 0.05 + 0.55 * s.z;
      var sx = s.x - mx * s.z * 26;
      var sy = s.y - offset * sp - my * s.z * 18;
      sy = ((sy % H) + H) % H;
      sx = ((sx % W) + W) % W;
      var tw = quieto ? 1 : 0.72 + 0.28 * Math.sin(t * 0.001 * s.ts + s.tw);
      var a = s.a * tw * vis * brillo;
      if (a <= 0.02) continue;
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.fillStyle = COLORS[s.c];
      if (lineas) {
        var len = clamp(vel * sp * (1.6 + w * 7), -340, 340);
        if (Math.abs(len) > 1.5) {
          // estela tenue detrás y cabeza brillante delante: se lee hacia dónde viaja la estrella
          ctx.globalAlpha = (a > 1 ? 1 : a) * 0.42;
          ctx.strokeStyle = COLORS[s.c];
          ctx.lineWidth = s.r * 1.1;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + len); ctx.stroke();
          ctx.globalAlpha = a > 1 ? 1 : a;
          ctx.fillRect(sx - s.r, sy - s.r, s.r * 2, s.r * 2.4);
          continue;
        }
      }
      if (s.r < 1.1) ctx.fillRect(sx - s.r, sy - s.r, s.r * 2, s.r * 2);
      else { ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, 6.2832); ctx.fill(); }
      if (mouse.active && s.z > 0.35) {
        var ddx = sx - mouse.px, ddy = sy - mouse.py;
        if (ddx * ddx + ddy * ddy < 26000 && cercanas.length < 16) cercanas.push(sx, sy);
      }
    }

    // constelación junto al ratón
    if (cercanas.length > 2 && !lineas) {
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = '#bcd2ff';
      for (var a1 = 0; a1 < cercanas.length; a1 += 2) {
        for (var b1 = a1 + 2; b1 < cercanas.length; b1 += 2) {
          var lx = cercanas[a1] - cercanas[b1], ly = cercanas[a1 + 1] - cercanas[b1 + 1];
          var dd = lx * lx + ly * ly;
          if (dd < 14000) {
            ctx.globalAlpha = (1 - dd / 14000) * 0.4;
            ctx.beginPath(); ctx.moveTo(cercanas[a1], cercanas[a1 + 1]); ctx.lineTo(cercanas[b1], cercanas[b1 + 1]); ctx.stroke();
          }
        }
        var qx = cercanas[a1] - mouse.px, qy = cercanas[a1 + 1] - mouse.py, qd = qx * qx + qy * qy;
        ctx.globalAlpha = (1 - qd / 26000) * 0.22;
        ctx.beginPath(); ctx.moveTo(cercanas[a1], cercanas[a1 + 1]); ctx.lineTo(mouse.px, mouse.py); ctx.stroke();
      }
    }

    // destello del salto
    if (w > 0.02) {
      ctx.globalAlpha = w * 0.08;
      ctx.fillStyle = '#9fb8ff';
      ctx.fillRect(0, 0, W, H);
    }

    // cometas
    if (!quieto) {
      if (t > nextComet) {
        lanzarCometa(null, null, Math.random() < 0.5 ? -1 : 1);
        nextComet = t + (d < 0.25 ? rnd(2600, 6000) : rnd(9000, 17000));
      }
      for (var c = comets.length - 1; c >= 0; c--) {
        var k = comets[c];
        k.life += dt;
        k.x += k.vx * k.sp * dt; k.y += k.vy * k.sp * dt;
        var vida = k.life / k.max;
        if (vida >= 1) { comets.splice(c, 1); continue; }
        var alfa = Math.sin(Math.PI * vida);
        var tx = k.x - k.vx * k.len, ty = k.y - k.vy * k.len;
        var g = ctx.createLinearGradient(k.x, k.y, tx, ty);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * alfa) + ')');
        g.addColorStop(0.15, 'rgba(210,228,255,' + (0.5 * alfa) + ')');
        g.addColorStop(1, 'rgba(160,190,255,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g; ctx.lineWidth = k.w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.globalAlpha = alfa * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(k.x, k.y, k.w * 1.1, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- bucle ---------- */
  function bucle(t){
    if (!running) return;
    var dt = lastT ? Math.min(50, t - lastT) : 16;
    lastT = t;
    if (!document.hidden) dibujar(t, dt);
    requestAnimationFrame(bucle);
  }
  var pendiente = false;
  function pedirDibujo(){
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function(t){ pendiente = false; dibujar(t, 16); });
  }

  /* ---------- eventos ---------- */
  var rt = null;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(medir, 150); }, { passive: true });
  window.addEventListener('load', medirPagina);
  if (window.ResizeObserver) new ResizeObserver(function(){ medirPagina(); }).observe(document.body);

  if (!quieto) {
    window.addEventListener('pointermove', function(e){
      if (e.pointerType === 'touch') return;
      mouse.tx = (e.clientX / W - 0.5) * 2;
      mouse.ty = (e.clientY / H - 0.5) * 2;
      mouse.px = e.clientX; mouse.py = e.clientY; mouse.active = finePointer;
    }, { passive: true });
    document.addEventListener('pointerleave', function(){ mouse.active = false; mouse.tx = 0; mouse.ty = 0; });
    // clic en una zona vacía: estrella fugaz desde ese punto
    document.addEventListener('click', function(e){
      if (e.target.closest('a,button,input,textarea,select,label,[role="dialog"],.rod-panel,.nav,.mobile-menu')) return;
      var sel = window.getSelection && String(window.getSelection());
      if (sel) return;
      lanzarCometa(e.clientX, e.clientY, e.clientX > W / 2 ? -1 : 1);
    });
  } else {
    window.addEventListener('scroll', pedirDibujo, { passive: true });
  }

  medir();
  window.A2WD_cosmos = { medir: medirPagina };
  if (!quieto) {
    nextComet = performance.now() + 1500;
    requestAnimationFrame(bucle);
  } else {
    pedirDibujo();
  }
})();
