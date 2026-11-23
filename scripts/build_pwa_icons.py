"""Refills Shop: iconos PWA exactos con el logo oficial, en un cuadrado de esquinas suaves."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
assets = ROOT / "assets"
source = Image.open(assets / "refills-icon.png").convert("RGBA")
RESAMPLE = Image.Resampling.LANCZOS


def rounded_alpha(side: int, radius_ratio: float = .072) -> Image.Image:
    # Dibujar grande y reducir para conservar bordes suaves en Android.
    scale = 4
    mask = Image.new("L", (side * scale, side * scale), 0)
    brush = ImageDraw.Draw(mask)
    brush.rounded_rectangle(
        (0, 0, side * scale - 1, side * scale - 1),
        radius=round(side * radius_ratio * scale), fill=255
    )
    return mask.resize((side, side), RESAMPLE)


for size in (192, 512):
    # El logo no se estira ni se corta. El diseño de origen ya es cuadrado.
    art = ImageOps.contain(source, (size, size), RESAMPLE)
    icon = Image.new("RGBA", (size, size), "#063d84")
    icon.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    alpha = rounded_alpha(size)
    icon.putalpha(alpha)
    icon.save(assets / f"refills-app-{size}.png", format="PNG", optimize=True)

# Android recorta de forma distinta los iconos maskable. Dejar el logo completo
# dentro de la zona central segura sobre fondo azul, sin transparencias externas.
size = 512
maskable = Image.new("RGBA", (size, size), "#073b85")
safe = 388
tile = ImageOps.contain(source, (safe, safe), RESAMPLE)
tile_bg = Image.new("RGBA", (safe, safe), "#073b85")
tile_bg.alpha_composite(tile, ((safe - tile.width) // 2, (safe - tile.height) // 2))
tile_bg.putalpha(rounded_alpha(safe, .095))
maskable.alpha_composite(tile_bg, ((size-safe)//2, (size-safe)//2))
maskable.save(assets / "refills-app-maskable-512.png", format="PNG", optimize=True)
print("Refills Shop: iconos exactos 192, 512 y maskable, 4 esquinas ligeramente redondeadas.")
