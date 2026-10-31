"""Generate the deterministic Bruz Digital social sharing card."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "social" / "bruz-social-card.png"
FONT_DIR = ROOT / "downloaded-site" / "public" / "fonts" / "JakantaSans"

canvas = Image.new("RGB", (1200, 630), "#0d1416")
draw = ImageDraw.Draw(canvas)

regular = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Regular.ttf"), 28)
semibold = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-SemiBold.ttf"), 66)
bold = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 74)
bold_accent = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 58)
brand = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 42)

draw.rectangle((0, 0, 1200, 12), fill="#b7f47c")
draw.text((72, 62), "bruz", font=brand, fill="#f3f5f1")
draw.ellipse((171, 64, 181, 74), fill="#b7f47c")
draw.text((72, 157), "WE BUILD TECH.", font=bold, fill="#f3f5f1")
draw.text((72, 252), "YOU BUILD BUSINESS.", font=bold_accent, fill="#b7f47c")
draw.text((75, 355), "DIGITAL STUDIO + PRODUCTS", font=regular, fill="#aab5b6")

# Engineering lab motif
panel = (760, 96, 1128, 520)
draw.rounded_rectangle(panel, radius=24, fill="#18272a", outline="#40585d", width=2)
for x in range(800, 1100, 74):
    draw.line((x, 158, x, 464), fill="#26383b", width=2)
for y in range(176, 465, 72):
    draw.line((790, y, 1098, y), fill="#26383b", width=2)
draw.text((790, 122), "BRUZ / SYSTEM LAB", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-SemiBold.ttf"), 16), fill="#b7f47c")
draw.rounded_rectangle((810, 278, 918, 362), radius=8, fill="#203438", outline="#648287", width=2)
draw.rounded_rectangle((970, 252, 1082, 388), radius=8, fill="#29432e", outline="#b7f47c", width=3)
draw.line((918, 320, 970, 320), fill="#b7f47c", width=4)
draw.ellipse((938, 311, 956, 329), fill="#b7f47c")
draw.text((830, 306), "INPUT", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-SemiBold.ttf"), 16), fill="#f3f5f1")
draw.text((992, 300), "BRUZ", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 20), fill="#b7f47c")
draw.text((989, 332), "BUILD", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Regular.ttf"), 15), fill="#f3f5f1")

draw.text((74, 553), "bruzdigital.com", font=regular, fill="#f3f5f1")
OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, optimize=True)
print(OUT)
