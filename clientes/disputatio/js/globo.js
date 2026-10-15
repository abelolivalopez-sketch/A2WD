const THREE = window.THREE;

const CONFIG = {
  radio: 1,
  campoVision: 36,
  ocupacionReposo: 0.78,
  ocupacionReposoVertical: 0.92,
  ocupacionEnfoque: 1.3,
  ocupacionMinima: 0.4,
  distanciaMinima: 1.3,
  distanciaInicial: 6,
  vistaInicial: { lat: 30, lng: -22 },
  latitudMaxima: 72,
  giroPorSegundo: 4,
  esperaGiro: 9000,
  suavidad: 4,
  frenadoInercia: 3.2,
  umbralToque: 6,
  pixelesDetalle: 1600,
  mapaBase: "img/tierra-2k.png",
  mapaDetalle: "img/tierra-4k.png",
  colorTierra: 0x000000,
  colorMar: 0x00fa5a,
  direccionLuz: [-0.55, 0.6, 0.6],
  pasoSemitono: 5.5,
  coberturaSemitono: 0.5
};

const SOMBREADO = {
  vertice: [
    "varying vec2 vUv;",
    "varying vec3 vNormal;",
    "varying vec3 vVista;",
    "void main() {",
    "  vec4 posicion = modelViewMatrix * vec4(position, 1.0);",
    "  vUv = uv;",
    "  vNormal = normalize(normalMatrix * normal);",
    "  vVista = normalize(-posicion.xyz);",
    "  gl_Position = projectionMatrix * posicion;",
    "}"
  ].join("\n"),
  fragmento: [
    "uniform sampler2D mapa;",
    "uniform vec3 tierra;",
    "uniform vec3 mar;",
    "uniform vec3 luz;",
    "uniform float paso;",
    "uniform float cobertura;",
    "varying vec2 vUv;",
    "varying vec3 vNormal;",
    "varying vec3 vVista;",
    "float semitono(float cantidad) {",
    "  vec2 celda = fract(mat2(0.7071, 0.7071, -0.7071, 0.7071) * gl_FragCoord.xy / paso) - 0.5;",
    "  float radio = sqrt(cantidad / 3.14159);",
    "  float suave = 0.8 / paso;",
    "  return 1.0 - smoothstep(radio - suave, radio + suave, length(celda));",
    "}",
    "void main() {",
    "  vec3 normal = normalize(vNormal);",
    "  float sombra = 1.0 - max(dot(normal, normalize(luz)), 0.0);",
    "  vec3 color = mix(tierra, mar, texture2D(mapa, vUv).r);",
    "  color = mix(color, tierra, semitono(smoothstep(0.4, 1.0, sombra) * cobertura));",
    "  float borde = 1.0 - max(dot(normal, normalize(vVista)), 0.0);",
    "  color = mix(color, mar, smoothstep(0.86, 0.95, borde));",
    "  gl_FragColor = vec4(color, 1.0);",
    "}"
  ].join("\n")
};

const tres = {
  renderer: null,
  escena: null,
  camara: null,
  globo: null,
  rayo: null,
  auxiliar: null
};

const estado = {
  lienzo: null,
  capa: null,
  alTocar: null,
  giroAutomatico: false,
  vista: { ...CONFIG.vistaInicial, distancia: CONFIG.distanciaInicial },
  destino: { ...CONFIG.vistaInicial, distancia: CONFIG.distanciaInicial },
  inercia: { lat: 0, lng: 0 },
  desplazamiento: { x: 0, y: 0 },
  hueco: { arriba: 0, derecha: 0, abajo: 0, izquierda: 0 },
  enfoque: "inicio",
  punteros: new Map(),
  arrastre: null,
  pellizco: null,
  zoomManual: false,
  ultimaInteraccion: -Infinity,
  marcadores: [],
  puntoNuevo: null,
  ancho: 1,
  alto: 1,
  tiempoAnterior: 0
};

const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");

function limitar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function suavizar(desde, hasta, valor) {
  const avance = limitar((valor - desde) / (hasta - desde), 0, 1);
  return avance * avance * (3 - 2 * avance);
}

function seguir(actual, destino, factor) {
  return actual + (destino - actual) * factor;
}

function normalizarLongitud(lng) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function aRadianes(grados) {
  return (grados * Math.PI) / 180;
}

function latLngAVector(lat, lng, radio, salida = new THREE.Vector3()) {
  const fi = aRadianes(lng + 180);
  const theta = aRadianes(90 - lat);
  return salida.set(-radio * Math.sin(theta) * Math.cos(fi), radio * Math.cos(theta), radio * Math.sin(theta) * Math.sin(fi));
}

function vectorALatLng(vector) {
  const unidad = vector.clone().normalize();
  return {
    lat: 90 - THREE.MathUtils.radToDeg(Math.acos(unidad.y)),
    lng: normalizarLongitud(THREE.MathUtils.radToDeg(Math.atan2(unidad.z, -unidad.x)) - 180)
  };
}

function areaUtil() {
  return {
    ancho: Math.max(estado.ancho - estado.hueco.izquierda - estado.hueco.derecha, estado.ancho * 0.3),
    alto: Math.max(estado.alto - estado.hueco.arriba - estado.hueco.abajo, estado.alto * 0.3)
  };
}

function tangenteMinima() {
  const tangente = Math.tan(aRadianes(CONFIG.campoVision / 2));
  const util = areaUtil();
  return Math.min((tangente * util.alto) / estado.alto, (tangente * util.ancho) / estado.alto);
}

function distanciaParaOcupar(fraccion) {
  return CONFIG.radio * Math.sqrt(1 + 1 / (fraccion * tangenteMinima()) ** 2);
}

function distanciaDelEnfoque() {
  if (estado.enfoque === "lugar") return distanciaParaOcupar(CONFIG.ocupacionEnfoque);
  const util = areaUtil();
  return distanciaParaOcupar(util.ancho < util.alto ? CONFIG.ocupacionReposoVertical : CONFIG.ocupacionReposo);
}

function limitarDistancia(distancia) {
  return limitar(distancia, CONFIG.distanciaMinima, distanciaParaOcupar(CONFIG.ocupacionMinima));
}

function gradosPorPixel() {
  const distancia = estado.vista.distancia;
  const tangente = Math.tan(aRadianes(CONFIG.campoVision / 2));
  const radioEnPixeles = ((estado.alto / 2) * CONFIG.radio) / (Math.sqrt(Math.max(distancia ** 2 - CONFIG.radio ** 2, 0.01)) * tangente);
  return 180 / Math.PI / radioEnPixeles;
}

function marcarInteraccion() {
  estado.ultimaInteraccion = performance.now();
}

function girar(dLat, dLng) {
  estado.destino.lat = limitar(estado.destino.lat + dLat, -CONFIG.latitudMaxima, CONFIG.latitudMaxima);
  estado.destino.lng = normalizarLongitud(estado.destino.lng + dLng);
  estado.vista.lat = estado.destino.lat;
  estado.vista.lng = estado.destino.lng;
}

function crearRenderizador() {
  tres.renderer = new THREE.WebGLRenderer({ canvas: estado.lienzo, antialias: true, alpha: true, powerPreference: "high-performance" });
  tres.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  tres.escena = new THREE.Scene();
  tres.camara = new THREE.PerspectiveCamera(CONFIG.campoVision, 1, 0.1, 200);
  tres.rayo = new THREE.Raycaster();
  tres.auxiliar = new THREE.Vector3();
  tres.escena.add(tres.camara);
}

function crearEsfera() {
  const escala = tres.renderer.getPixelRatio();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      mapa: { value: null },
      tierra: { value: new THREE.Color(CONFIG.colorTierra) },
      mar: { value: new THREE.Color(CONFIG.colorMar) },
      luz: { value: new THREE.Vector3(...CONFIG.direccionLuz) },
      paso: { value: CONFIG.pasoSemitono * escala },
      cobertura: { value: CONFIG.coberturaSemitono }
    },
    vertexShader: SOMBREADO.vertice,
    fragmentShader: SOMBREADO.fragmento
  });
  tres.globo = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.radio, 128, 96), material);
  tres.escena.add(tres.globo);
}

function cargarMapa(ruta) {
  return new Promise((resolver, rechazar) => new THREE.TextureLoader().load(ruta, resolver, undefined, rechazar));
}

function aplicarMapa(textura) {
  const anterior = tres.globo.material.uniforms.mapa.value;
  textura.anisotropy = tres.renderer.capabilities.getMaxAnisotropy();
  tres.globo.material.uniforms.mapa.value = textura;
  if (anterior) anterior.dispose();
}

function necesitaDetalle() {
  const pixeles = Math.max(estado.ancho, estado.alto) * tres.renderer.getPixelRatio();
  return pixeles > CONFIG.pixelesDetalle && tres.renderer.capabilities.maxTextureSize >= 4096;
}

function crearBotonMarcador(nombre, etiqueta, clase, cantidad = 0) {
  const boton = document.createElement("button");
  const punto = document.createElement("span");
  const texto = document.createElement("span");
  boton.type = "button";
  boton.className = ["marcador", clase].filter(Boolean).join(" ");
  boton.setAttribute("aria-label", etiqueta);
  punto.className = "marcador__punto";
  texto.className = "marcador__nombre";
  texto.textContent = nombre;
  texto.setAttribute("aria-hidden", "true");
  if (cantidad > 1) {
    const numero = document.createElement("span");
    numero.className = "marcador__cantidad";
    numero.textContent = String(cantidad);
    texto.append(numero);
  }
  boton.append(punto, texto);
  estado.capa.append(boton);
  return boton;
}

function colocarMarcador(marcador, camara, horizonte) {
  const coseno = marcador.posicion.dot(camara) / (marcador.posicion.length() * camara.length());
  const visibilidad = suavizar(horizonte + 0.015, horizonte + 0.12, coseno);
  tres.auxiliar.copy(marcador.posicion).project(tres.camara);
  const x = ((tres.auxiliar.x + 1) / 2) * estado.ancho;
  const y = ((1 - tres.auxiliar.y) / 2) * estado.alto;
  marcador.boton.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  marcador.boton.style.opacity = visibilidad.toFixed(3);
  marcador.boton.classList.toggle("marcador--oculto", visibilidad < 0.2);
}

function actualizarMarcadores() {
  const camara = tres.camara.position;
  const horizonte = CONFIG.radio / camara.length();
  estado.marcadores.forEach((marcador) => colocarMarcador(marcador, camara, horizonte));
  if (estado.puntoNuevo) colocarMarcador(estado.puntoNuevo, camara, horizonte);
}

function separacionPunteros() {
  const [a, b] = [...estado.punteros.values()];
  return Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1);
}

function empezarArrastre(x, y, movido) {
  const ahora = performance.now();
  estado.arrastre = { x, y, inicioX: x, inicioY: y, inicio: ahora, tiempo: ahora, movido };
  estado.inercia.lat = 0;
  estado.inercia.lng = 0;
}

function arrastrar(x, y) {
  const arrastre = estado.arrastre;
  const ahora = performance.now();
  const grados = gradosPorPixel();
  const dLat = (y - arrastre.y) * grados;
  const dLng = -(x - arrastre.x) * grados;
  const segundos = Math.max((ahora - arrastre.tiempo) / 1000, 0.008);
  arrastre.movido = arrastre.movido || Math.hypot(x - arrastre.inicioX, y - arrastre.inicioY) > CONFIG.umbralToque;
  girar(dLat, dLng);
  estado.inercia.lat = estado.inercia.lat * 0.25 + (dLat / segundos) * 0.75;
  estado.inercia.lng = estado.inercia.lng * 0.25 + (dLng / segundos) * 0.75;
  arrastre.x = x;
  arrastre.y = y;
  arrastre.tiempo = ahora;
}

function alPulsar(evento) {
  if (evento.button > 0) return;
  estado.lienzo.setPointerCapture(evento.pointerId);
  estado.punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
  estado.destino.lat = estado.vista.lat;
  estado.destino.lng = estado.vista.lng;
  marcarInteraccion();
  if (estado.punteros.size === 1) empezarArrastre(evento.clientX, evento.clientY, false);
  if (estado.punteros.size === 2) {
    estado.arrastre = null;
    estado.inercia.lat = 0;
    estado.inercia.lng = 0;
    estado.pellizco = { separacion: separacionPunteros(), distancia: estado.destino.distancia };
  }
}

function alMover(evento) {
  const puntero = estado.punteros.get(evento.pointerId);
  if (!puntero) return;
  puntero.x = evento.clientX;
  puntero.y = evento.clientY;
  marcarInteraccion();
  if (estado.pellizco && estado.punteros.size === 2) {
    estado.zoomManual = true;
    estado.destino.distancia = limitarDistancia((estado.pellizco.distancia * estado.pellizco.separacion) / separacionPunteros());
    return;
  }
  if (estado.arrastre) arrastrar(evento.clientX, evento.clientY);
}

function alSoltar(evento) {
  if (!estado.punteros.has(evento.pointerId)) return;
  const arrastre = estado.arrastre;
  const ahora = performance.now();
  estado.punteros.delete(evento.pointerId);
  marcarInteraccion();
  if (estado.punteros.size < 2) estado.pellizco = null;
  if (estado.punteros.size === 1) {
    const [restante] = estado.punteros.values();
    return empezarArrastre(restante.x, restante.y, true);
  }
  estado.arrastre = null;
  if (!arrastre) return;
  if (ahora - arrastre.tiempo > 80) {
    estado.inercia.lat = 0;
    estado.inercia.lng = 0;
  }
  const esToque = evento.type === "pointerup" && !arrastre.movido && ahora - arrastre.inicio < 500;
  if (esToque && estado.alTocar) estado.alTocar(evento.clientX, evento.clientY);
}

function alRueda(evento) {
  evento.preventDefault();
  const delta = evento.deltaMode === 1 ? evento.deltaY * 33 : evento.deltaY;
  estado.zoomManual = true;
  estado.destino.distancia = limitarDistancia(estado.destino.distancia * Math.exp(delta * 0.0012));
  marcarInteraccion();
}

function ajustarTamano() {
  estado.ancho = Math.max(estado.lienzo.clientWidth, 1);
  estado.alto = Math.max(estado.lienzo.clientHeight, 1);
  tres.renderer.setSize(estado.ancho, estado.alto, false);
  tres.camara.aspect = estado.ancho / estado.alto;
  tres.camara.updateProjectionMatrix();
  if (estado.enfoque === "inicio") return;
  if (!estado.zoomManual) estado.destino.distancia = distanciaDelEnfoque();
  estado.destino.distancia = limitarDistancia(estado.destino.distancia);
}

function girarSolo(segundos) {
  const quieto = performance.now() - estado.ultimaInteraccion > CONFIG.esperaGiro;
  if (!estado.giroAutomatico || movimientoReducido.matches || estado.enfoque !== "reposo" || estado.punteros.size || !quieto) return;
  estado.destino.lng = normalizarLongitud(estado.destino.lng - CONFIG.giroPorSegundo * segundos);
}

function aplicarInercia(segundos) {
  if (estado.arrastre || Math.hypot(estado.inercia.lat, estado.inercia.lng) < 0.5) return;
  girar(estado.inercia.lat * segundos, estado.inercia.lng * segundos);
  const freno = Math.exp(-CONFIG.frenadoInercia * segundos);
  estado.inercia.lat *= freno;
  estado.inercia.lng *= freno;
}

function actualizarVista(segundos) {
  const factor = movimientoReducido.matches ? 1 : 1 - Math.exp(-CONFIG.suavidad * segundos);
  estado.vista.lat = seguir(estado.vista.lat, estado.destino.lat, factor);
  estado.vista.lng = normalizarLongitud(estado.vista.lng + normalizarLongitud(estado.destino.lng - estado.vista.lng) * factor);
  estado.vista.distancia = seguir(estado.vista.distancia, estado.destino.distancia, factor);
  estado.desplazamiento.x = seguir(estado.desplazamiento.x, (estado.hueco.derecha - estado.hueco.izquierda) / 2, factor);
  estado.desplazamiento.y = seguir(estado.desplazamiento.y, (estado.hueco.abajo - estado.hueco.arriba) / 2, factor);
}

function colocarCamara() {
  latLngAVector(estado.vista.lat, estado.vista.lng, estado.vista.distancia, tres.camara.position);
  tres.camara.lookAt(0, 0, 0);
  tres.camara.updateMatrixWorld();
  tres.camara.setViewOffset(estado.ancho, estado.alto, estado.desplazamiento.x, estado.desplazamiento.y, estado.ancho, estado.alto);
}

function bucle(tiempo) {
  const segundos = Math.min((tiempo - estado.tiempoAnterior) / 1000, 0.05);
  estado.tiempoAnterior = tiempo;
  girarSolo(segundos);
  aplicarInercia(segundos);
  actualizarVista(segundos);
  colocarCamara();
  actualizarMarcadores();
  tres.renderer.render(tres.escena, tres.camara);
  window.requestAnimationFrame(bucle);
}

function conectarControles() {
  estado.lienzo.addEventListener("pointerdown", alPulsar);
  estado.lienzo.addEventListener("pointermove", alMover);
  estado.lienzo.addEventListener("pointerup", alSoltar);
  estado.lienzo.addEventListener("pointercancel", alSoltar);
  estado.lienzo.addEventListener("wheel", alRueda, { passive: false });
  window.addEventListener("resize", ajustarTamano);
}

function alCargarMapa(textura) {
  aplicarMapa(textura);
  estado.enfoque = "reposo";
  estado.destino.distancia = distanciaDelEnfoque();
  if (necesitaDetalle()) cargarMapa(CONFIG.mapaDetalle).then(aplicarMapa).catch(() => {});
}

export function iniciarGlobo({ lienzo, capa, alTocar = null, giroAutomatico = false }) {
  if (!THREE) return Promise.reject(new Error("three.js"));
  estado.lienzo = lienzo;
  estado.capa = capa;
  estado.alTocar = alTocar;
  estado.giroAutomatico = giroAutomatico;
  try {
    crearRenderizador();
  } catch (error) {
    return Promise.reject(error);
  }
  ajustarTamano();
  crearEsfera();
  conectarControles();
  window.requestAnimationFrame(bucle);
  return cargarMapa(CONFIG.mapaBase).then(alCargarMapa);
}

export function ponerMarcadores(lista, { alPulsar, etiqueta, clase = () => "", cantidad = () => 0 }) {
  estado.marcadores.forEach((marcador) => marcador.boton.remove());
  estado.marcadores = lista.map((lugar) => {
    const boton = crearBotonMarcador(lugar.ciudad, etiqueta(lugar), clase(lugar), cantidad(lugar));
    boton.dataset.id = lugar.id;
    boton.addEventListener("click", () => alPulsar(lugar.id));
    boton.addEventListener("focus", () => {
      if (boton.matches(":focus-visible")) mirarA(lugar);
    });
    return { id: lugar.id, boton, posicion: latLngAVector(lugar.lat, lugar.lng, CONFIG.radio * 1.002) };
  });
}

export function marcarActivo(id) {
  estado.marcadores.forEach((marcador) => {
    marcador.boton.classList.toggle("marcador--activo", marcador.id === id);
    marcador.boton.setAttribute("aria-expanded", String(marcador.id === id));
  });
}

export function botonDeMarcador(id) {
  return estado.marcadores.find((marcador) => marcador.id === id)?.boton || null;
}

export function mirarA(lugar) {
  estado.inercia.lat = 0;
  estado.inercia.lng = 0;
  estado.destino.lat = limitar(lugar.lat, -CONFIG.latitudMaxima, CONFIG.latitudMaxima);
  estado.destino.lng = lugar.lng;
  marcarInteraccion();
}

export function enfocar(lugar) {
  mirarA(lugar);
  estado.enfoque = "lugar";
  estado.zoomManual = false;
  if (tres.renderer) estado.destino.distancia = distanciaDelEnfoque();
}

export function reposar() {
  estado.enfoque = "reposo";
  estado.zoomManual = false;
  if (tres.renderer) estado.destino.distancia = distanciaDelEnfoque();
  marcarInteraccion();
}

export function fijarGiroAutomatico(activo) {
  estado.giroAutomatico = activo;
  marcarInteraccion();
}

export function fijarHueco(hueco) {
  estado.hueco.arriba = hueco.arriba || 0;
  estado.hueco.derecha = hueco.derecha || 0;
  estado.hueco.abajo = hueco.abajo || 0;
  estado.hueco.izquierda = hueco.izquierda || 0;
  if (tres.renderer && estado.enfoque !== "inicio" && !estado.zoomManual) estado.destino.distancia = distanciaDelEnfoque();
}

export function ponerPuntoNuevo(lugar) {
  if (!lugar) {
    estado.puntoNuevo?.boton.remove();
    estado.puntoNuevo = null;
    return;
  }
  if (!estado.puntoNuevo) {
    const boton = crearBotonMarcador("", "", "marcador--nuevo");
    boton.tabIndex = -1;
    boton.setAttribute("aria-hidden", "true");
    estado.puntoNuevo = { boton, posicion: new THREE.Vector3() };
  }
  latLngAVector(lugar.lat, lugar.lng, CONFIG.radio * 1.002, estado.puntoNuevo.posicion);
}

export function lugarEn(x, y) {
  if (!tres.renderer) return null;
  const caja = estado.lienzo.getBoundingClientRect();
  const raton = new THREE.Vector2(((x - caja.left) / caja.width) * 2 - 1, -((y - caja.top) / caja.height) * 2 + 1);
  tres.rayo.setFromCamera(raton, tres.camara);
  const [impacto] = tres.rayo.intersectObject(tres.globo);
  return impacto ? vectorALatLng(impacto.point) : null;
}
