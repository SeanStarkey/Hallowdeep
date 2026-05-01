from pathlib import Path
from math import sin, cos
from PIL import Image, ImageDraw, ImageFont

WIDTH = 1280
HEIGHT = 720
FPS = 15
DURATION_SECONDS = 14
FRAME_COUNT = FPS * DURATION_SECONDS
OUT_DIR = Path(__file__).parent / "dist"
OUT_FILE = OUT_DIR / "hallowdeep-ad.gif"

COLORS = {
    "bg": "#080908",
    "floor": "#20271f",
    "wall_dark": "#3f3a2d",
    "wall": "#6c6047",
    "ink": "#f4ecd8",
    "muted": "#b8aa91",
    "gold": "#e2b04f",
}

SPRITES = {
    "hero": ["....aaaa....", "...aaaaaa...", "...abbaaa...", "..abbbba...", "..aaabba...", "...cccc....", "..cccccc...", ".cccdcccc..", "...c..c....", "..cc..cc..."],
    "vampire": ["...cccc...", "..caaaac..", ".cabbabac.", ".caaaaca..", "..caaac...", "...cc....."],
    "mummy": ["..bbbbbb..", ".baaaaab.", ".abababa.", ".baaaaab.", "..ababab.", ".baaaaab.", "..bb..bb."],
    "tonic": ["....bb....", "...bbbb...", "...dddd...", "..daaaad..", ".daacaad.", ".daaaaad.", "..dddddd.."],
    "gear": ["...aa...", "..abba..", ".abccba.", ".acbbca.", ".abccba.", "..abba..", "...aa..."],
    "stairs": ["..........", ".......aaa", ".....aaaac", "...aaaaccc", ".aaaaccccc", "aaaccccccc", "cccccccccc"],
}

SPRITE_COLORS = {
    "hero": {"a": "#e2b04f", "b": "#f4ecd8", "c": "#7f4f2c", "d": "#2f2416"},
    "vampire": {"a": "#cf4f55", "b": "#f4ecd8", "c": "#2c1720"},
    "mummy": {"a": "#c9b073", "b": "#f0dfaa", "c": "#6b5a35"},
    "tonic": {"a": "#79a56f", "b": "#e2b04f", "c": "#f4ecd8", "d": "#5a3a1d"},
    "gear": {"a": "#d9d0ba", "b": "#7d7767", "c": "#e2b04f"},
    "stairs": {"a": "#8a6fb0", "b": "#cbb7f1", "c": "#4b3c64"},
}


def font(size, bold=False, serif=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if serif or bold else "",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if serif else "",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


TITLE_FONT = font(116, bold=True, serif=True)
SUBTITLE_FONT = font(36, bold=True)
FEATURE_FONT = font(42, bold=True)
BODY_FONT = font(25, bold=True)
URL_FONT = font(24, bold=True)


def ease(t):
    t = max(0, min(1, t))
    return 2 * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 2) / 2


def text_center(draw, xy, text, fill, font_obj):
    box = draw.textbbox((0, 0), text, font=font_obj)
    x = xy[0] - (box[2] - box[0]) / 2
    y = xy[1] - (box[3] - box[1]) / 2
    draw.text((x, y), text, fill=fill, font=font_obj)


def draw_sprite(draw, name, x, y, scale):
    pattern = SPRITES[name]
    colors = SPRITE_COLORS[name]
    sprite_w = max(len(row) for row in pattern) * scale
    sprite_h = len(pattern) * scale
    ox = int(x - sprite_w / 2)
    oy = int(y - sprite_h / 2)

    for row_index, row in enumerate(pattern):
        for col_index, swatch in enumerate(row):
            if swatch == ".":
                continue
            px = ox + col_index * scale
            py = oy + row_index * scale
            draw.rectangle((px, py, px + scale - 1, py + scale - 1), fill=colors[swatch])


def draw_dungeon(draw, frame):
    tile = 36
    time = frame / FPS
    cam_x = sin(time * 1.8) * 120
    cam_y = cos(time * 1.25) * 72
    draw.rectangle((0, 0, WIDTH, HEIGHT), fill=COLORS["bg"])

    for y in range(-2, 24):
        for x in range(-2, 40):
            px = int(x * tile - (cam_x % tile))
            py = int(y * tile - (cam_y % tile))
            wall = x % 9 == 0 or y % 7 == 0 or (x + y) % 17 == 0
            draw.rectangle((px, py, px + tile - 2, py + tile - 2), fill=COLORS["wall_dark"] if wall else COLORS["floor"])
            if wall:
                draw.rectangle((px + 4, py + 4, px + tile - 10, py + tile - 10), fill=COLORS["wall"])

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    for radius, alpha in [(520, 190), (360, 130), (210, 70)]:
        odraw.ellipse((640 - radius, 360 - radius, 640 + radius, 360 + radius), fill=(226, 176, 79, max(0, 80 - alpha // 4)))
    return overlay


def draw_feature(draw, title, body, y, progress):
    x = 100 + ease(progress) * 44
    alpha_color = COLORS["gold"] if progress > 0.05 else "#7b6532"
    draw.text((x, y), title, fill=alpha_color, font=FEATURE_FONT)
    draw.text((x, y + 48), body, fill=COLORS["ink"], font=BODY_FONT)


def frame_image(frame):
    img = Image.new("RGB", (WIDTH, HEIGHT), COLORS["bg"])
    draw = ImageDraw.Draw(img)
    overlay = draw_dungeon(draw, frame)
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(img)

    time = frame / FPS
    total = frame / max(1, FRAME_COUNT - 1)
    walk = sin(time * 5) * 8
    draw_sprite(draw, "hero", 600 + walk, 402, 5)
    draw_sprite(draw, "vampire", 760 - walk * 0.8, 390, 4)
    draw_sprite(draw, "mummy", 850, 468 + sin(time * 4) * 5, 4)
    draw_sprite(draw, "tonic", 500, 500, 4)
    draw_sprite(draw, "gear", 430, 412, 4)
    draw_sprite(draw, "stairs", 930, 295, 4)

    if total < 0.22:
        text_center(draw, (WIDTH / 2, 210), "Hallowdeep", COLORS["gold"], TITLE_FONT)
        text_center(draw, (WIDTH / 2, 286), "A spooky roguelike descent", COLORS["ink"], SUBTITLE_FONT)

    if 0.28 < total < 0.50:
        draw_feature(draw, "Bigger scrolling dungeons", "Explore torchlit halls packed with danger.", 118, (total - 0.28) / 0.1)
    if 0.48 < total < 0.70:
        draw_feature(draw, "Loot, levels, and monsters", "Find gear. Gain power. Face legends.", 118, (total - 0.48) / 0.1)
    if 0.66 < total < 0.84:
        draw_feature(draw, "Shared high scores", "Carve your name into the scorebook.", 118, (total - 0.66) / 0.1)

    if total > 0.78:
        dark = Image.new("RGBA", (WIDTH, HEIGHT), (8, 9, 8, int(210 * min(1, (total - 0.78) / 0.1))))
        img = Image.alpha_composite(img, dark)
        draw = ImageDraw.Draw(img)
        text_center(draw, (WIDTH / 2, 286), "Enter Hallowdeep", COLORS["gold"], font(92, bold=True, serif=True))
        text_center(draw, (WIDTH / 2, 356), "Explore. Equip. Survive. Score.", COLORS["ink"], SUBTITLE_FONT)
        text_center(draw, (WIDTH / 2, 420), "seanstarkey.dev/Hallowdeep", COLORS["muted"], URL_FONT)

    return img.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = [frame_image(frame) for frame in range(FRAME_COUNT)]
    frames[0].save(
        OUT_FILE,
        save_all=True,
        append_images=frames[1:],
        duration=int(1000 / FPS),
        loop=0,
        optimize=True,
    )
    print(OUT_FILE)


if __name__ == "__main__":
    main()
