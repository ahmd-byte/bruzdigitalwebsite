"""Generate the deterministic Bruz Digital social sharing card."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "social" / "bruz-social-card.png"
FONT_DIR = ROOT / "downloaded-site" / "public" / "fonts" / "JakantaSans"

canvas = Image.new("RGB", (1200, 630), "#F3F7FB")
draw = ImageDraw.Draw(canvas)

regular = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Regular.ttf"), 28)
semibold = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-SemiBold.ttf"), 66)
bold = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 74)
bold_accent = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 58)
brand = ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 42)

draw.rectangle((0, 0, 1200, 12), fill="#163B8C")
draw.text((72, 62), "bruz", font=brand, fill="#10243A")
draw.ellipse((171, 64, 181, 74), fill="#16B8C4")
draw.text((72, 157), "WE BUILD TECH.", font=bold, fill="#10243A")
draw.text((72, 252), "YOU BUILD BUSINESS.", font=bold_accent, fill="#163B8C")
draw.text((75, 355), "DIGITAL STUDIO + PRODUCTS", font=regular, fill="#43566B")

# Engineering lab motif
panel = (760, 96, 1128, 520)
draw.rounded_rectangle(panel, radius=24, fill="#10243A", outline="#35516D", width=2)
for x in range(800, 1100, 74):
    draw.line((x, 158, x, 464), fill="#29425D", width=2)
for y in range(176, 465, 72):
    draw.line((790, y, 1098, y), fill="#29425D", width=2)
draw.text((790, 122), "BRUZ / SYSTEM LAB", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-SemiBold.ttf"), 16), fill="#16B8C4")
draw.rounded_rectangle((810, 278, 918, 362), radius=8, fill="#18314A", outline="#46627D", width=2)
draw.rounded_rectangle((970, 252, 1082, 388), radius=8, fill="#123D50", outline="#16B8C4", width=3)
draw.line((918, 320, 970, 320), fill="#16B8C4", width=4)
draw.ellipse((938, 311, 956, 329), fill="#F49A38")
draw.text((830, 306), "INPUT", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-SemiBold.ttf"), 16), fill="#F3F7FB")
draw.text((992, 300), "BRUZ", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Bold.ttf"), 20), fill="#16B8C4")
draw.text((989, 332), "BUILD", font=ImageFont.truetype(str(FONT_DIR / "PlusJakartaSans-Regular.ttf"), 15), fill="#F3F7FB")

draw.text((74, 553), "bruzdigital.com", font=regular, fill="#10243A")
OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, optimize=True)
print(OUT)
