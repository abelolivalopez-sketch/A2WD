import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ANCHO = 4096
ALTO = 2048
ESCALA = 2
PASO_RETICULA = 15

INTENSIDAD = {
    "reticula": 0.2,
    "ecuador": 0.34,
    "fronteras": 0.38,
}


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


def capa_fronteras(ruta, ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    for poligono in leer_poligonos(ruta):
        for anillo in poligono:
            lapiz.line(a_pixeles(anillo, ancho, alto), fill=255, width=2, joint="curve")
    return imagen


def capa_reticula(ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    lapiz = ImageDraw.Draw(imagen)
    for lon in range(-180, 181, PASO_RETICULA):
        x, _ = a_pixel(lon, 0, ancho, alto)
        lapiz.line([(x, 0), (x, alto)], fill=255, width=2)
    for lat in range(-75, 76, PASO_RETICULA):
        if lat == 0:
            continue
        _, y = a_pixel(0, lat, ancho, alto)
        lapiz.line([(0, y), (ancho, y)], fill=255, width=2)
    return imagen


def capa_ecuador(ancho, alto):
    imagen = Image.new("L", (ancho, alto), 0)
    _, y = a_pixel(0, 0, ancho, alto)
    ImageDraw.Draw(imagen).line([(0, y), (ancho, y)], fill=255, width=5)
    return imagen


def reducir(imagen):
    return np.asarray(imagen.resize((ANCHO, ALTO), Image.LANCZOS), dtype=np.float32) / 255


def componer(tierra, fronteras, reticula, ecuador):
    mar = 1 - tierra
    oscuro = np.maximum(reticula * INTENSIDAD["reticula"], ecuador * INTENSIDAD["ecuador"]) * mar
    claro = fronteras * INTENSIDAD["fronteras"] * tierra
    valor = mar * (1 - oscuro) + claro
    return Image.fromarray(np.clip(valor * 255 + 0.5, 0, 255).astype(np.uint8), "L")


def generar(carpeta_geojson, carpeta_salida):
    carpeta_geojson, carpeta_salida = Path(carpeta_geojson), Path(carpeta_salida)
    grande = (ANCHO * ESCALA, ALTO * ESCALA)
    tierra = reducir(mascara_tierra(carpeta_geojson / "ne_50m_land.geojson", *grande))
    fronteras = reducir(capa_fronteras(carpeta_geojson / "ne_50m_admin_0_countries.geojson", *grande))
    reticula = reducir(capa_reticula(*grande))
    ecuador = reducir(capa_ecuador(*grande))
    mapa = componer(tierra, fronteras, reticula, ecuador)
    carpeta_salida.mkdir(parents=True, exist_ok=True)
    mapa.save(carpeta_salida / "tierra-4k.png", optimize=True)
    mapa.resize((ANCHO // 2, ALTO // 2), Image.LANCZOS).save(carpeta_salida / "tierra-2k.png", optimize=True)


if __name__ == "__main__":
    carpeta_base = Path(__file__).resolve().parent.parent
    generar(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else carpeta_base / "img")
