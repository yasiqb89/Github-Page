from __future__ import annotations

from math import cos, sin, pi
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SCALE = 4
W, H = 420, 860
SW, SH = W * SCALE, H * SCALE


def scaled(value: int | float) -> int:
    return int(round(value * SCALE))


def color(hex_value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_value = hex_value.lstrip("#")
    return (
        int(hex_value[0:2], 16),
        int(hex_value[2:4], 16),
        int(hex_value[4:6], 16),
        alpha,
    )


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if weight == "bold" else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if weight == "bold" else "/Library/Fonts/Arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, scaled(size))
        except OSError:
            continue
    return ImageFont.load_default()


FONT_REG = font(16)
FONT_MED = font(16, "bold")
FONT_BOLD = font(18, "bold")


def draw_centered(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fill, size: int, weight: str = "regular") -> None:
    selected = font(size, "bold" if weight == "bold" else "regular")
    bbox = draw.textbbox((0, 0), text, font=selected)
    draw.text((xy[0] - (bbox[2] - bbox[0]) / 2, xy[1] - (bbox[3] - bbox[1]) / 2), text, font=selected, fill=fill)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(tuple(scaled(v) for v in box), radius=scaled(radius), fill=fill, outline=outline, width=scaled(width))


def line(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], fill, width: int = 1) -> None:
    draw.line([(scaled(x), scaled(y)) for x, y in points], fill=fill, width=scaled(width), joint="curve")


def circle(draw: ImageDraw.ImageDraw, center: tuple[int, int], radius: int, fill=None, outline=None, width: int = 1) -> None:
    x, y = center
    draw.ellipse((scaled(x - radius), scaled(y - radius), scaled(x + radius), scaled(y + radius)), fill=fill, outline=outline, width=scaled(width))


def gradient_screen() -> Image.Image:
    screen = Image.new("RGBA", (scaled(364), scaled(786)), (0, 0, 0, 0))
    pix = screen.load()
    for y in range(screen.height):
        t = y / max(1, screen.height - 1)
        r = int(21 * (1 - t) + 6 * t)
        g = int(35 * (1 - t) + 11 * t)
        b = int(49 * (1 - t) + 16 * t)
        for x in range(screen.width):
            pix[x, y] = (r, g, b, 255)

    glow = Image.new("RGBA", screen.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((scaled(18), scaled(-120), scaled(346), scaled(230)), fill=color("#BFFF47", 28))
    glow = glow.filter(ImageFilter.GaussianBlur(scaled(26)))
    return Image.alpha_composite(screen, glow)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=scaled(radius), fill=255)
    return mask


def clipped_overlay(img: Image.Image, box: tuple[int, int, int, int], radius: int, overlay: Image.Image) -> None:
    x1, y1, x2, y2 = (scaled(v) for v in box)
    size = (x2 - x1, y2 - y1)
    mask = rounded_mask(size, radius)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    layer.alpha_composite(overlay.resize(size, Image.Resampling.BICUBIC))
    layer.putalpha(Image.composite(layer.getchannel("A"), Image.new("L", size, 0), mask))
    img.alpha_composite(layer, (x1, y1))


def linear_gloss(size: tuple[int, int], alpha: int = 52) -> Image.Image:
    gloss = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    w, h = size
    gd.polygon(
        [
            (int(w * -0.08), 0),
            (int(w * 0.46), 0),
            (int(w * 0.18), h),
            (int(w * -0.2), h),
        ],
        fill=(255, 255, 255, alpha),
    )
    gd.polygon(
        [
            (int(w * 0.68), 0),
            (int(w * 0.82), 0),
            (int(w * 0.46), h),
            (int(w * 0.34), h),
        ],
        fill=(255, 255, 255, alpha // 3),
    )
    return gloss.filter(ImageFilter.GaussianBlur(scaled(5)))


def base_phone() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Titanium-like body: stacked rounded shells create visible thickness in the PNG itself.
    rounded(d, (8, 14, 418, 858), 72, color("#0E1114", 230), None)
    rounded(d, (1, 4, 410, 849), 72, color("#5B6065"), None)
    rounded(d, (7, 9, 414, 854), 68, color("#22262B"), None)
    rounded(d, (12, 14, 408, 848), 64, color("#0B0D10"), color("#6B7177", 175), 2)
    rounded(d, (18, 21, 402, 841), 59, color("#1D2126"), color("#363B41", 255), 2)
    rounded(d, (24, 27, 396, 835), 53, color("#05080A"), color("#05080A", 255), 1)

    # Side buttons and antenna cuts make the silhouette read more like a real device.
    rounded(d, (0, 156, 7, 214), 4, color("#4F565D"), None)
    rounded(d, (0, 236, 7, 310), 4, color("#333A41"), None)
    rounded(d, (0, 330, 7, 404), 4, color("#333A41"), None)
    rounded(d, (410, 278, 419, 394), 4, color("#2F363D"), None)
    line(d, [(44, 26), (112, 16)], color("#838A90", 92), 2)
    line(d, [(318, 18), (379, 31)], color("#838A90", 70), 2)
    line(d, [(29, 762), (38, 806)], color("#838A90", 72), 2)
    line(d, [(381, 770), (390, 814)], color("#838A90", 60), 2)

    screen = gradient_screen()
    mask = rounded_mask(screen.size, 48)
    screen.putalpha(mask)
    img.alpha_composite(screen, (scaled(28), scaled(31)))

    glass = linear_gloss(screen.size, 46)
    glass.putalpha(Image.composite(glass.getchannel("A"), Image.new("L", screen.size, 0), mask))
    img.alpha_composite(glass, (scaled(28), scaled(31)))

    d = ImageDraw.Draw(img)

    rounded(d, (144, 42, 276, 80), 20, color("#020405"))
    circle(d, (262, 61), 8, color("#131A20"))
    circle(d, (264, 59), 3, color("#22303A", 190))
    d.text((scaled(50), scaled(64)), "9:41", font=font(15, "bold"), fill=(238, 245, 232, 210))

    # Fine outer glass rim and a small rim highlight keep the mockup from feeling flat.
    rounded(d, (27, 30, 397, 834), 52, None, color("#FFFFFF", 24), 1)
    line(d, [(58, 34), (194, 25), (325, 32)], (255, 255, 255, 38), 2)
    return img, d


def draw_arc(draw: ImageDraw.ImageDraw, center: tuple[int, int], radius: int, start: int, end: int, fill, width: int) -> None:
    box = (scaled(center[0] - radius), scaled(center[1] - radius), scaled(center[0] + radius), scaled(center[1] + radius))
    draw.arc(box, start=start, end=end, fill=fill, width=scaled(width))
    for deg in (start, end):
        rad = deg * pi / 180
        x = center[0] + radius * cos(rad)
        y = center[1] + radius * sin(rad)
        circle(draw, (int(x), int(y)), width // 2, fill)


def save_phone(img: Image.Image, name: str) -> None:
    img = img.resize((W, H), Image.Resampling.LANCZOS)
    img.save(ROOT / name)


def make_main() -> None:
    img, d = base_phone()
    rounded(d, (130, 128, 290, 154), 13, color("#BFFF47", 24), color("#BFFF47", 56), 1)
    draw_centered(d, (210 * SCALE, 141 * SCALE), "DEEP WORK", color("#BFFF47"), 11, "bold")

    circle(d, (210, 366), 118, None, (255, 255, 255, 18), 11)
    draw_arc(d, (210, 366), 118, -92, 205, color("#BFFF47"), 11)
    draw_arc(d, (210, 366), 118, 205, 268, color("#5AC8FA"), 11)
    draw_centered(d, (210 * SCALE, 349 * SCALE), "37", (244, 248, 236, 255), 72, "bold")
    draw_centered(d, (210 * SCALE, 397 * SCALE), "minutes left", (255, 255, 255, 110), 15)

    rounded(d, (76, 532, 344, 598), 24, (255, 255, 255, 14), (255, 255, 255, 24), 1)
    d.text((scaled(102), scaled(552)), "Shield active", font=font(15, "bold"), fill=(240, 247, 235, 225))
    d.text((scaled(102), scaled(575)), "7 distracting apps blocked", font=font(13), fill=(255, 255, 255, 112))
    circle(d, (315, 565), 13, color("#BFFF47", 46), color("#BFFF47", 90), 1)

    for i, value in enumerate([0.62, 0.88, 0.44, 0.74, 0.56]):
        x = 82 + i * 52
        rounded(d, (x, 662 - value * 92, x + 24, 682), 10, color("#BFFF47", int(58 + value * 120)))
    d.text((scaled(78), scaled(720)), "Today", font=font(13, "bold"), fill=(255, 255, 255, 170))
    d.text((scaled(78), scaled(746)), "2h 18m reclaimed", font=font(22, "bold"), fill=color("#F5FAEF"))
    save_phone(img, "phone-main.png")


def make_secondary() -> None:
    img, d = base_phone()
    d.text((scaled(52), scaled(124)), "Choose mode", font=font(34, "bold"), fill=color("#F5FAEF"))
    d.text((scaled(52), scaled(168)), "Match the block to the hour.", font=font(15), fill=(255, 255, 255, 118))
    modes = [
        ("Deep Work", "90 min", "#BFFF47"),
        ("Study", "50 min", "#5AC8FA"),
        ("Gym", "60 min", "#7BFF7B"),
        ("Wind Down", "30 min", "#D7B3FF"),
        ("Family", "45 min", "#FFD166"),
        ("No Scroll", "25 min", "#FF7A90"),
    ]
    for i, (title, mins, accent) in enumerate(modes):
        row = i % 2
        col = i // 2
        x = 50 + row * 160
        y = 230 + col * 142
        rounded(d, (x, y, x + 136, y + 112), 24, (255, 255, 255, 15), (255, 255, 255, 26), 1)
        circle(d, (x + 33, y + 34), 13, color(accent, 58), color(accent, 120), 1)
        d.text((scaled(x + 24), scaled(y + 62)), title, font=font(16, "bold"), fill=(244, 248, 236, 230))
        d.text((scaled(x + 24), scaled(y + 86)), mins, font=font(12), fill=(255, 255, 255, 104))
    rounded(d, (52, 700, 368, 760), 30, color("#BFFF47"))
    draw_centered(d, (210 * SCALE, 730 * SCALE), "Start session", color("#0A0E0C"), 16, "bold")
    save_phone(img, "phone-secondary.png")


def make_back() -> None:
    img, d = base_phone()
    d.text((scaled(52), scaled(126)), "Progress", font=font(34, "bold"), fill=color("#F5FAEF"))
    d.text((scaled(52), scaled(170)), "Identity grows as you show up.", font=font(15), fill=(255, 255, 255, 118))
    rounded(d, (52, 224, 368, 382), 28, (255, 255, 255, 15), (255, 255, 255, 26), 1)
    circle(d, (116, 303), 40, color("#BFFF47", 30), color("#BFFF47", 128), 2)
    draw_centered(d, (116 * SCALE, 303 * SCALE), "12", color("#BFFF47"), 30, "bold")
    d.text((scaled(178), scaled(274)), "The Aligned", font=font(22, "bold"), fill=(244, 248, 236, 230))
    d.text((scaled(178), scaled(308)), "stage unlocked", font=font(13), fill=(255, 255, 255, 110))
    line(d, [(178, 342), (314, 342)], color("#BFFF47", 130), 4)

    labels = ["Mind", "Body", "Craft", "Care", "Rest"]
    points = [(210, 462), (303, 530), (268, 642), (152, 642), (117, 530)]
    for p in points:
        circle(d, p, 5, color("#BFFF47", 160))
    for i, p in enumerate(points):
        p2 = points[(i + 1) % len(points)]
        line(d, [p, p2], color("#BFFF47", 92), 3)
    for i, label in enumerate(labels):
        x, y = points[i]
        draw_centered(d, (x * SCALE, (y + (34 if y < 500 else 28)) * SCALE), label, (255, 255, 255, 110), 12)

    rounded(d, (52, 712, 368, 760), 24, (255, 255, 255, 14), (255, 255, 255, 24), 1)
    d.text((scaled(76), scaled(728)), "Current streak", font=font(13), fill=(255, 255, 255, 112))
    d.text((scaled(258), scaled(722)), "14 days", font=font(22, "bold"), fill=color("#F5FAEF"))
    save_phone(img, "phone-back.png")


if __name__ == "__main__":
    make_main()
    make_secondary()
    make_back()
