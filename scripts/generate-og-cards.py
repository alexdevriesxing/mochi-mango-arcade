from __future__ import annotations

import io
import json
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path.cwd()
PUBLIC = ROOT / "public"
GAMES = json.loads((PUBLIC / "assets/data/games.json").read_text(encoding="utf-8"))
OUTPUT = PUBLIC / "assets/images/og/games"
OUTPUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def gradient(size: tuple[int, int], start: tuple[int, int, int], end: tuple[int, int, int]) -> Image.Image:
    width, height = size
    strip = Image.new("RGB", (width, 1))
    draw = ImageDraw.Draw(strip)
    for x in range(width):
        t = x / max(1, width - 1)
        colour = tuple(round(a + (b - a) * t) for a, b in zip(start, end))
        draw.point((x, 0), fill=colour)
    return strip.resize(size, Image.Resampling.BILINEAR)


def load_art(path_value: str) -> Image.Image | None:
    source = PUBLIC / path_value.lstrip("/")
    if not source.exists():
        return None
    try:
        if source.suffix.lower() == ".svg":
            png = cairosvg.svg2png(url=str(source), output_width=720, output_height=520)
            return Image.open(io.BytesIO(png)).convert("RGBA")
        return Image.open(source).convert("RGBA")
    except Exception:
        return None


def fit_art(art: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    max_w, max_h = max_size
    scale = min(max_w / art.width, max_h / art.height)
    return art.resize((max(1, int(art.width * scale)), max(1, int(art.height * scale))), Image.Resampling.LANCZOS)


def wrapped_lines(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, width: int, max_lines: int = 3) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
            if len(lines) == max_lines - 1:
                break
    if current and len(lines) < max_lines:
        remaining = " ".join(words[sum(len(line.split()) for line in lines):])
        line = remaining
        while draw.textbbox((0, 0), line, font=fnt)[2] > width and len(line) > 4:
            line = line[:-2].rstrip() + "…"
        lines.append(line)
    return lines[:max_lines]


for game in GAMES:
    canvas = gradient((W, H), (40, 24, 79), (177, 25, 103))
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((780, -150, 1320, 390), fill=(255, 209, 102, 45))
    od.ellipse((900, 250, 1320, 700), fill=(125, 93, 255, 55))
    od.rounded_rectangle((54, 48, 1146, 582), radius=42, fill=(255, 255, 255, 20), outline=(255, 255, 255, 55), width=2)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay)

    art = load_art(game.get("image", ""))
    if art:
        art = fit_art(art, (470, 430))
        shadow = Image.new("RGBA", art.size, (0, 0, 0, 0))
        shadow.putalpha(art.getchannel("A").filter(ImageFilter.GaussianBlur(18)))
        shadow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        x = 690 + (430 - art.width) // 2
        y = 105 + (420 - art.height) // 2
        shadow_layer.alpha_composite(shadow, (x + 12, y + 18))
        canvas = Image.alpha_composite(canvas, shadow_layer)
        canvas.alpha_composite(art, (x, y))

    draw = ImageDraw.Draw(canvas)
    small = font(FONT_BOLD, 27)
    title_font = font(FONT_BOLD, 58)
    body_font = font(FONT_REGULAR, 27)
    badge_font = font(FONT_BOLD, 23)

    draw.rounded_rectangle((88, 84, 410, 132), radius=24, fill=(255, 255, 255, 235))
    draw.text((111, 94), "MOCHI MANGO ARCADE", font=small, fill=(63, 36, 109))

    y = 178
    for line in wrapped_lines(draw, game["title"], title_font, 560, 3):
        draw.text((88, y), line, font=title_font, fill="white", stroke_width=1, stroke_fill=(32, 16, 63))
        y += 70

    genre = str(game.get("genre", "Browser game"))
    mascot = str(game.get("mascot", "Original characters"))
    draw.text((90, 418), f"{genre}  •  {mascot}", font=body_font, fill=(255, 228, 164))
    draw.rounded_rectangle((88, 474, 502, 532), radius=29, fill=(255, 255, 255, 240))
    draw.text((118, 487), "PLAY FREE IN YOUR BROWSER", font=badge_font, fill=(168, 15, 82))
    draw.text((88, 552), "mochimangoarcade.com", font=body_font, fill=(255, 255, 255, 220))

    out = OUTPUT / f"{game['slug']}.jpg"
    canvas.convert("RGB").save(out, "JPEG", quality=88, optimize=True, progressive=True)

print(json.dumps({"ok": True, "cards": len(GAMES), "output": str(OUTPUT)}, indent=2))
