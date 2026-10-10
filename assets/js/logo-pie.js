/* =====================================================================
   LOGOTIPO DEL PIE (páginas de servicio)
   ---------------------------------------------------------------------
   El mismo dibujo que llevan index.html y proyectos.html dentro de la
   página, pasado a un archivo para no repetirlo en cada página nueva.
   ===================================================================== */
/* =====================================================================
   Logotipo animado: banda de Möbius metálica girando detrás de "A²WD".
   Dibujo propio en <canvas> 2D (sin librerías): muy ligero.
   - Se detiene sola si la pestaña no está visible o el logo sale de pantalla.
   - Con "reducir movimiento" activado en el móvil se queda quieta.
   ===================================================================== */
(function(){
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 150, SUB = 3;                      // segmentos a lo largo y a lo ancho
  var luz = norm([-0.5, -0.6, 0.62]);      // luz desde arriba-izquierda-delante
  var ojo = [0, 0, 1];
  function norm(v){ var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; }
  function cruz(a, b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function punto(u, v, giro){
    // Banda de Möbius: radio 1, ancho ±0.34, alargada en horizontal
    var c = Math.cos(u/2), r = 1 + v*c;
    var x = r*Math.cos(u+giro), y = r*Math.sin(u+giro), z = v*Math.sin(u/2);
    // inclinación para verla como un anillo alrededor del texto
    var inc = 0.98, ci = Math.cos(inc), si = Math.sin(inc);
    var y2 = y*ci - z*si, z2 = y*si + z*ci;
    return [x*1.85, y2, z2];
  }
  function Logo(el){
    this.cv = el.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
    this.visible = true; this.t = Math.random()*6; this.medir();
  }
  Logo.prototype.medir = function(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.cv.clientWidth, h = this.cv.clientHeight;
    this.w = w; this.h = h;
    this.cv.width = Math.round(w*dpr); this.cv.height = Math.round(h*dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  Logo.prototype.dibujar = function(){
    var ctx = this.ctx, w = this.w, h = this.h, giro = this.t;
    ctx.clearRect(0, 0, w, h);
    var esc = Math.min(w/(2*1.85*1.42), h/(2*1.12)) * 0.97, cx = w/2, cy = h/2;
    var caras = [], ancho = 0.4;
    for (var i = 0; i < N; i++){
      var u0 = i/N*Math.PI*2, u1 = (i+1)/N*Math.PI*2;
      for (var j = 0; j < SUB; j++){
        var v0 = -ancho + 2*ancho*j/SUB, v1 = -ancho + 2*ancho*(j+1)/SUB;
        var a = punto(u0, v0, giro), b = punto(u1, v0, giro), c = punto(u1, v1, giro), d = punto(u0, v1, giro);
        var n = norm(cruz([b[0]-a[0], b[1]-a[1], b[2]-a[2]], [d[0]-a[0], d[1]-a[1], d[2]-a[2]]));
        if (n[2] < 0) n = [-n[0], -n[1], -n[2]];                 // la cinta tiene una sola cara: se ilumina por ambos lados
        var dif = Math.max(0, n[0]*luz[0] + n[1]*luz[1] + n[2]*luz[2]);
        var hv = norm([luz[0]+ojo[0], luz[1]+ojo[1], luz[2]+ojo[2]]);
        var brillo = Math.pow(Math.max(0, n[0]*hv[0] + n[1]*hv[1] + n[2]*hv[2]), 28);
        var prof = (a[2]+b[2]+c[2]+d[2])/4;
        var g = 26 + 175*Math.pow(dif, 1.4) + 120*brillo + 22*prof; // acero: de gris oscuro a casi blanco
        g = Math.max(22, Math.min(246, g));
        caras.push({ z: prof, g: g|0, p: [a, b, c, d], borde: j === 0 ? 0 : (j === SUB-1 ? 2 : -1) });
      }
    }
    caras.sort(function(x, y){ return x.z - y.z; });               // de atrás hacia delante
    for (var k = 0; k < caras.length; k++){
      var f = caras[k], col = 'rgb(' + f.g + ',' + f.g + ',' + Math.min(255, f.g + 4) + ')';
      ctx.beginPath();
      for (var m = 0; m < 4; m++){
        var q = f.p[m], px = cx + q[0]*esc, py = cy + q[1]*esc;
        if (m === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.6;
      ctx.fill(); ctx.stroke();
      if (f.borde >= 0){                                              // canto de la cinta, más claro: define la forma
        var e0 = f.borde === 0 ? f.p[0] : f.p[2], e1 = f.borde === 0 ? f.p[1] : f.p[3];
        ctx.beginPath(); ctx.moveTo(cx + e0[0]*esc, cy + e0[1]*esc); ctx.lineTo(cx + e1[0]*esc, cy + e1[1]*esc);
        var gb = Math.min(250, f.g + 70);
        ctx.strokeStyle = 'rgb(' + gb + ',' + gb + ',' + gb + ')'; ctx.lineWidth = Math.max(0.8, esc*0.035); ctx.stroke();
      }
    }
  };
  var logos = Array.prototype.map.call(document.querySelectorAll('.mobius-logo'), function(el){ return new Logo(el); });
  if (!logos.length || !logos[0].ctx) return;
  logos.forEach(function(l){ l.dibujar(); });
  addEventListener('resize', function(){ logos.forEach(function(l){ l.medir(); l.dibujar(); }); }, { passive: true });
  if (quieto) return;
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){
      logos.forEach(function(l){ if (l.cv === e.target) l.visible = e.isIntersecting; });
    }); });
    logos.forEach(function(l){ io.observe(l.cv); });
  }
  var antes = 0;
  function bucle(ahora){
    var dt = Math.min(0.05, (ahora - antes)/1000 || 0); antes = ahora;
    if (!document.hidden) logos.forEach(function(l){ if (l.visible){ l.t += dt*0.45; l.dibujar(); } });
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);
})();
