import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.ndimage import distance_transform_edt, gaussian_filter

ANCHO = 4096
ALTO = 2048
ESCALA = 2
LADO_PAPEL = 512

COLORES = {
    "mar": (230, 217, 188),
    "tierra": (242, 233, 211),
    "tinta": (52, 38, 22),
    "sepia": (118, 90, 56),
    "papel": (232, 220, 194),
}

ONDAS = [(5, 0.5), (11, 0.34), (18, 0.22), (27, 0.12)]
PASO_RETICULA = 15
TROPICOS = [23.44, -23.44, 66.56, -66.56]
MEDIO_ECUADOR = 0.45
GRANO = 3.5

ESTILOS = {
    "continente": ("im-fell-english-sc-latin-400-normal.woff2", 36, 12),
    "continente-menor": ("im-fell-english-sc-latin-400-normal.woff2", 24, 7),
    "oceano": ("im-fell-english-latin-400-italic.woff2", 30, 7),
    "mar": ("im-fell-english-latin-400-italic.woff2", 17, 3),
    "circulo": ("im-fell-english-latin-400-italic.woff2", 16, 3),
}

ROTULOS = [
    ("EVROPA", 30, 54, "continente"),
    ("ASIA", 95, 52, "continente"),
    ("AFRICA", 20, 9, "continente"),
    ("AMERICA", -102, 50, "continente"),
    ("SEPTENTRIONALIS", -102, 44.5, "continente-menor"),
    ("AMERICA", -60, -7, "continente"),
    ("MERIDIONALIS", -60, -12.5, "continente-menor"),
    ("NOVA HOLLANDIA", 134, -24, "continente-menor"),
    ("OCEANVS ATLANTICVS", -47, 31, "oceano"),
    ("OCEANVS AETHIOPICVS", -14, -24, "oceano"),
    ("MARE PACIFICVM", -140, 14, "oceano"),
    ("MARE PACIFICVM", -118, -28, "oceano"),
    ("OCEANVS INDICVS", 78, -22, "oceano"),
    ("Mare Mediterraneum", 18, 34.2, "mar"),
    ("Circulus aequinoctialis", -150, 1.8, "circulo"),
    ("Tropicus Cancri", -158, 25.2, "circulo"),
    ("Tropicus Capricorni", -100, -21.6, "circulo"),
    ("Circulus arcticus", -8, 68.6, "circulo"),
    ("Circulus antarcticus", -125, -64.4, "circulo"),
]


def leer_poligonos(ruta):
    datos = json.loads(Path(ruta).read_text(encoding="utf-8"))
    for elemento in datos["features"]:
        geometria = elemento["geometry"]
        if geometria["type"] == "Polygon":
            yield geometria["coordinates"]
        elif geometria["type"] == "MultiPolygon":
            yield from geometria["coordinates"]


def a_pixel(lon, lat, ancho, alto):
    return (lon + 180) / 360 * ancho, (90 - lat) / 180 * alto


def a_pixeles(anillo, ancho, alto):
    return [a_pixel(lon, lat, ancho, alto) for lon, lat in anillo]


def mascara_tierra(ruta, ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    for poligono in leer_poligonos(ruta):
        lapiz.polygon(a_pixeles(poligono[0], ancho, alto), fill=255)
        for hueco in poligono[1:]:
            lapiz.polygon(a_pixeles(hueco, ancho, alto), fill=0)
    return imagen


def capa_costa(ruta, ancho, alto, grosor):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    for poligono in leer_poligonos(ruta):
        for anillo in poligono:
            lapiz.line(a_pixeles(anillo, ancho, alto), fill=255, width=grosor, joint="curve")
    return imagen


def trazo_discontinuo(lapiz, puntos, trazo, hueco, grosor):
    recorrido = 0.0
    periodo = trazo + hueco
    for (x0, y0), (x1, y1) in zip(puntos, puntos[1:]):
        largo = math.hypot(x1 - x0, y1 - y0)
        avance = 0.0
        while avance < largo:
            fase = (recorrido + avance) % periodo
            tramo = min((trazo - fase) if fase < trazo else (periodo - fase), largo - avance)
            if fase < trazo:
                inicio = avance / largo
                fin = (avance + tramo) / largo
                lapiz.line([(x0 + (x1 - x0) * inicio, y0 + (y1 - y0) * inicio), (x0 + (x1 - x0) * fin, y0 + (y1 - y0) * fin)], fill=255, width=grosor)
            avance += max(tramo, 0.01)
        recorrido += largo


def capa_fronteras(ruta, ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    for poligono in leer_poligonos(ruta):
        for anillo in poligono:
            trazo_discontinuo(lapiz, a_pixeles(anillo, ancho, alto), 10 * ESCALA, 6 * ESCALA, 2)
    return imagen


def capa_reticula(ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    for lon in range(-180, 181, PASO_RETICULA):
        x, _ = a_pixel(lon, 0, ancho, alto)
        lapiz.line([(x, 0), (x, alto)], fill=150, width=2)
    for lat in range(-75, 76, PASO_RETICULA):
        if lat == 0:
            continue
        _, y = a_pixel(0, lat, ancho, alto)
        lapiz.line([(0, y), (ancho, y)], fill=150, width=2)
    for lat in TROPICOS:
        _, y = a_pixel(0, lat, ancho, alto)
        trazo_discontinuo(lapiz, [(0, y), (ancho, y)], 14 * ESCALA, 8 * ESCALA, 2)
    return imagen


def capa_ecuador(ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    _, arriba = a_pixel(0, MEDIO_ECUADOR, ancho, alto)
    _, abajo = a_pixel(0, -MEDIO_ECUADOR, ancho, alto)
    lapiz.line([(0, arriba), (ancho, arriba)], fill=255, width=3)
    lapiz.line([(0, abajo), (ancho, abajo)], fill=255, width=3)
    for lon in range(-180, 180, 10):
        izquierda, _ = a_pixel(lon, 0, ancho, alto)
        derecha, _ = a_pixel(lon + 5, 0, ancho, alto)
        lapiz.rectangle([izquierda, arriba, derecha, abajo], fill=255)
    return imagen


def reducir(imagen):
    return np.asarray(imagen.resize((ANCHO, ALTO), Image.LANCZOS), dtype=np.float32) / 255


def intensidad_ondas(tierra):
    distancia = distance_transform_edt(tierra < 0.5)
    total = np.zeros_like(distancia, dtype=np.float32)
    for radio, fuerza in ONDAS:
        total = np.maximum(total, np.clip(1 - np.abs(distancia - radio) / 0.9, 0, 1) * fuerza)
    return total


def dibujar_rotulo(texto, fuente, espaciado):
    ancho = sum(fuente.getlength(letra) for letra in texto) + espaciado * (len(texto) - 1)
    imagen = Image.new("L", (math.ceil(ancho) + 8, math.ceil(fuente.size * 1.5)), 0)
    lapiz = ImageDraw.Draw(imagen)
    x = 4.0
    for letra in texto:
        lapiz.text((x, fuente.size * 0.15), letra, font=fuente, fill=255)
        x += fuente.getlength(letra) + espaciado
    return imagen


def capa_rotulos(carpeta_fuentes):
    capa = np.zeros((ALTO, ANCHO), dtype=np.float32)
    fuentes = {estilo: (ImageFont.truetype(str(carpeta_fuentes / archivo), tamano), espaciado) for estilo, (archivo, tamano, espaciado) in ESTILOS.items()}
    for texto, lon, lat, estilo in ROTULOS:
        fuente, espaciado = fuentes[estilo]
        rotulo = dibujar_rotulo(texto, fuente, espaciado)
        estirado = rotulo.resize((round(rotulo.width / math.cos(math.radians(lat))), rotulo.height), Image.LANCZOS)
        x, y = a_pixel(lon, lat, ANCHO, ALTO)
        izquierda, arriba = round(x - estirado.width / 2), round(y - estirado.height / 2)
        datos = np.asarray(estirado, dtype=np.float32) / 255
        zona = capa[arriba:arriba + datos.shape[0], izquierda:izquierda + datos.shape[1]]
        np.maximum(zona, datos[: zona.shape[0], : zona.shape[1]], out=zona)
    return capa


def mezclar(base, color, alfa):
    return base * (1 - alfa[..., None]) + np.array(color, dtype=np.float32) * alfa[..., None]


def manchas(forma, semilla):
    ruido = np.random.default_rng(semilla).normal(0, 1, forma).astype(np.float32)
    suave = gaussian_filter(ruido, sigma=forma[0] / 40, mode="wrap")
    return suave / (np.abs(suave).max() + 1e-6)


def componer(tierra, costa, fronteras, reticula, ecuador, rotulos):
    lienzo = np.zeros((ALTO, ANCHO, 3), dtype=np.float32) + np.array(COLORES["mar"], dtype=np.float32)
    lienzo = mezclar(lienzo, COLORES["tierra"], tierra)
    lienzo *= (1 + 0.035 * manchas((ALTO, ANCHO), 3))[..., None]
    lienzo = mezclar(lienzo, COLORES["sepia"], intensidad_ondas(tierra) * 0.75)
    lienzo = mezclar(lienzo, COLORES["sepia"], reticula * 0.45)
    lienzo = mezclar(lienzo, COLORES["sepia"], fronteras * tierra * 0.7)
    lienzo = mezclar(lienzo, COLORES["tinta"], ecuador * 0.6)
    lienzo = mezclar(lienzo, COLORES["tinta"], costa * 0.9)
    lienzo = mezclar(lienzo, COLORES["tinta"], rotulos * 0.88)
    grano = np.random.default_rng(7).normal(0, GRANO, (ALTO, ANCHO, 1)).astype(np.float32)
    return Image.fromarray(np.clip(lienzo + grano, 0, 255).astype(np.uint8))


def generar_papel(carpeta_salida):
    forma = (LADO_PAPEL, LADO_PAPEL)
    rng = np.random.default_rng(11)
    fino = gaussian_filter(rng.normal(0, 1, forma), sigma=0.7, mode="wrap") * 7
    medio = gaussian_filter(rng.normal(0, 1, forma), sigma=6, mode="wrap") * 16
    fibras = gaussian_filter(rng.normal(0, 1, forma), sigma=(0.6, 4), mode="wrap") * 5 + gaussian_filter(rng.normal(0, 1, forma), sigma=(4, 0.6), mode="wrap") * 5
    grande = manchas(forma, 5) * 7
    variacion = (fino + medio + fibras + grande).astype(np.float32)
    base = np.array(COLORES["papel"], dtype=np.float32)
    calido = np.array([1.0, 0.97, 0.9], dtype=np.float32)
    lienzo = base + variacion[..., None] * calido
    Image.fromarray(np.clip(lienzo, 0, 255).astype(np.uint8)).save(carpeta_salida / "papel.jpg", quality=82, optimize=True, progressive=True)


def generar(carpeta_geojson, carpeta_salida, carpeta_fuentes):
    carpeta_geojson, carpeta_salida, carpeta_fuentes = Path(carpeta_geojson), Path(carpeta_salida), Path(carpeta_fuentes)
    grande = (ANCHO * ESCALA, ALTO * ESCALA)
    tierra = reducir(mascara_tierra(carpeta_geojson / "ne_50m_land.geojson", *grande))
    costa = reducir(capa_costa(carpeta_geojson / "ne_50m_land.geojson", *grande, 3))
    fronteras = reducir(capa_fronteras(carpeta_geojson / "ne_50m_admin_0_countries.geojson", *grande))
    reticula = reducir(capa_reticula(*grande))
    ecuador = reducir(capa_ecuador(*grande))
    mapa = componer(tierra, costa, fronteras, reticula, ecuador, capa_rotulos(carpeta_fuentes))
    carpeta_salida.mkdir(parents=True, exist_ok=True)
    mapa.save(carpeta_salida / "tierra-4k.jpg", quality=82, optimize=True, progressive=True)
    mapa.filter(ImageFilter.GaussianBlur(0.5)).resize((ANCHO // 2, ALTO // 2), Image.LANCZOS).save(
        carpeta_salida / "tierra-2k.jpg", quality=86, optimize=True, progressive=True
    )
    generar_papel(carpeta_salida)


if __name__ == "__main__":
    carpeta_base = Path(__file__).resolve().parent.parent
    generar(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else carpeta_base / "img", carpeta_base / "fuentes")
