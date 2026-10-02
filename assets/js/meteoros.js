/* A2WD · estrellas fugaces del fondo de la home
   Dibujadas en un <canvas> fijo, detrás de la banda de Möbius.
   - Aparecen de vez en cuando (intervalo aleatorio) y duran menos de un segundo.
   - Cabeza brillante con halo, cola que se afina y se apaga, ligera curvatura
     de brillo (se encienden al entrar en la atmósfera y se extinguen).
   - Sin coste cuando no hay ninguna: solo se anima mientras una está visible.
   - Respeta "reducir movimiento" y se pausa con la pestaña oculta. */
(function(){
  if (!document.querySelector('.hero')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cv = document.createElement('canvas');
  cv.id = 'meteoros';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var W = 0, H = 0, dpr = 1;
  function medir(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  window.addEventListener('resize', medir, { passive: true });

  var activos = [];
  var anim = 0;
  var proxima = null;

  function azar(a, b){ return a + Math.random() * (b - a); }

  function crear(){
    // Casi todas caen en diagonal hacia abajo; el lado se elige al azar.
    var izquierda = Math.random() < 0.5;
    var ang = azar(22, 48) * Math.PI / 180;           // inclinación respecto a la horizontal
    var dirX = izquierda ? Math.cos(ang) : -Math.cos(ang);
    var dirY = Math.sin(ang);
    var escala = Math.min(1, Math.max(0.6, W / 1400));
    var recorrido = azar(260, 520) * escala;           // distancia total
    return {
      x: izquierda ? azar(W * 0.05, W * 0.55) : azar(W * 0.45, W * 0.95),
      y: azar(H * 0.03, H * 0.45),
      dx: dirX, dy: dirY,
      recorrido: recorrido,
      cola: azar(90, 190) * escala,                    // longitud máxima de la cola
      grosor: azar(0.9, 1.6),
      brillo: azar(0.55, 0.9),                         // sutiles: nunca a tope
      dur: azar(550, 1050),                            // ms
      t0: performance.now(),
      tono: Math.random() < 0.25 ? '255,236,214' : '214,230,255' // alguna algo cálida
    };
  }

  function curvaLuz(p){
    // Sube rápido, se mantiene y se apaga suave.
    if (p < 0.15) return p / 0.15;
    if (p < 0.6) return 1;
    return Math.max(0, 1 - (p - 0.6) / 0.4);
  }

  function dibujar(m, ahora){
    var p = (ahora - m.t0) / m.dur;
    if (p >= 1) return false;
    var avance = 1 - Math.pow(1 - p, 1.6);              // frena un poco al final
    var hx = m.x + m.dx * m.recorrido * avance;
    var hy = m.y + m.dy * m.recorrido * avance;
    var largo = m.cola * Math.min(1, p / 0.35 + 0.15) * (p > 0.7 ? 1 - (p - 0.7) * 1.4 : 1);
    var tx = hx - m.dx * largo, ty = hy - m.dy * largo;
    var a = m.brillo * curvaLuz(p);

    // Cola: degradado de transparente a la cabeza
    var g = ctx.createLinearGradient(tx, ty, hx, hy);
    g.addColorStop(0, 'rgba(' + m.tono + ',0)');
    g.addColorStop(0.65, 'rgba(' + m.tono + ',' + (a * 0.35).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,255,255,' + a.toFixed(3) + ')');
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    ctx.lineWidth = m.grosor;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();

    // Estela tenue más ancha (da volumen sin parecer un láser)
    ctx.lineWidth = m.grosor * 3.2;
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.moveTo(hx - m.dx * largo * 0.45, hy - m.dy * largo * 0.45); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.globalAlpha = 1;

    // Cabeza con halo
    var r = m.grosor * 4.5;
    var h = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
    h.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
    h.addColorStop(0.35, 'rgba(' + m.tono + ',' + (a * 0.45).toFixed(3) + ')');
    h.addColorStop(1, 'rgba(' + m.tono + ',0)');
    ctx.fillStyle = h;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
    return true;
  }

  function bucle(ahora){
    ctx.clearRect(0, 0, W, H);
    activos = activos.filter(function(m){ return dibujar(m, ahora); });
    if (activos.length) anim = requestAnimationFrame(bucle);
    else { anim = 0; ctx.clearRect(0, 0, W, H); }
  }

  function lanzar(){
    if (!document.hidden) {
      activos.push(crear());
      // De vez en cuando, una segunda poco después (como en una noche real)
      if (Math.random() < 0.12) setTimeout(function(){ activos.push(crear()); if (!anim) anim = requestAnimationFrame(bucle); }, azar(250, 900));
      if (!anim) anim = requestAnimationFrame(bucle);
    }
    programar();
  }

  function programar(){
    clearTimeout(proxima);
    proxima = setTimeout(lanzar, azar(6000, 15000));
  }

  // La primera aparece al poco de entrar, para que se descubra el efecto.
  proxima = setTimeout(lanzar, azar(2500, 4500));
})();
