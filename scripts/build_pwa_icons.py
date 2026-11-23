from pathlib import Path
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parents[1]
assets = ROOT / "assets"
source = Image.open(assets / "refills-icon.png").convert("RGBA")
for size in (192, 512):
    icon = ImageOps.fit(source, (size, size), method=Image.Resampling.LANCZOS)
    icon.save(assets / f"refills-app-{size}.png", format="PNG", optimize=True)
size = 512
mask = Image.new("RGBA", (size, size), "#053785")
safe = ImageOps.fit(source, (384, 384), method=Image.Resampling.LANCZOS)
mask.paste(safe, (64, 64), safe)
mask.save(assets / "refills-app-maskable-512.png", format="PNG", optimize=True)
print("Iconos PWA creados a partir del logo oficial:", [str(p.name) for p in assets.glob("refills-app-*.png")])
