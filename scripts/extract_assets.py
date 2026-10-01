"""Pull the visuals the site uses out of the Prism workshop deck.

    python3 scripts/extract_assets.py "/path/to/(Cohort 3) Prism: Workshop ME.pdf"

Three kinds of asset:
  - embedded raster images (photos, glass renders, templates) by xref
  - vector illustrations, rendered from a page region and split into
    separate icons wherever there is a vertical gutter of white
  - whole slides, for the deck strip on the edition page
"""
import io, sys, json
from pathlib import Path
import pymupdf as fitz
from PIL import Image, ImageChops

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
PDF = ARGS[0] if ARGS else str(Path.home() / "Downloads/(Cohort 3) Prism: Workshop ME.pdf")
OUT = Path(__file__).resolve().parent.parent / "public/img"
doc = fitz.open(PDF)


def save_webp(im, path, max_side=1400, q=82):
    im = im.copy()
    im.thumbnail((max_side, max_side))
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=q, method=6)


def xref_image(xref):
    info = doc.extract_image(xref)
    im = Image.open(io.BytesIO(info["image"]))
    smask = info.get("smask") or 0
    if smask:
        m = Image.open(io.BytesIO(doc.extract_image(smask)["image"])).convert("L")
        if m.size == im.size:
            im = im.convert("RGB")
            im.putalpha(m)
    return im


# ---- embedded rasters -------------------------------------------------------
RASTERS = {
    # glass renders
    "deck/glass-ribbon": (47, 1600), "deck/glass-loop": (141, 1600), "deck/glass-chair": (2313, 1600),
    "deck/double-diamond": (6956, 1600), "deck/double-diamond-sketch": (6940, 1200),
    "deck/cohort-room": (509, 1400), "deck/cohort-wall": (515, 1400),
    "deck/juicer": (13334, 900), "deck/why-ladder": (9102, 900), "deck/interview-sketch": (9206, 900),
    "deck/observe-sketch": (9578, 900), "deck/insights-wall": (14340, 1200), "deck/crazy8s-paper": (19481, 1200),
    "deck/mindset-shift": (27626, 1200), "deck/atm": (4505, 1000), "deck/design-cloud": (4221, 1200),
    "deck/eames": (4323, 800), "deck/ship-mri": (18321, 1000), "deck/role-play": (24929, 900),
    "deck/vibecode": (24939, 600), "deck/methods-wall": (6846, 1200),
    # perspective cards
    "templates/card-simplicity": (11226, 700), "templates/card-innovation": (11230, 700),
    "templates/card-user": (11234, 700), "templates/card-business": (11238, 700),
    # worksheets
    "templates/experience-map": (4721, 1400), "templates/interview-notes": (12242, 1400),
    "templates/stakeholder-map": (12246, 1400), "templates/observation-sheet": (12250, 1400),
    "templates/why-ladder": (12254, 1400), "templates/analogous": (19945, 1400),
    # chai crazy 8s sketches
    **{f"deck/chai-{i+1}": (x, 900) for i, x in enumerate([19629, 19633, 19637, 19641, 19647, 19651, 19659, 19663])},
    # cases
    "cases/airbnb": (5726, 1000), "cases/pepsico": (6059, 1000), "cases/mckinsey": (6286, 900),
    "cases/paytm": (10450, 1000), "cases/paytm-2": (10148, 1000), "cases/cred": (15683, 700), "cases/cred-2": (15691, 700),
    "cases/boa": (21060, 900), "cases/boa-2": (21056, 700), "cases/lucky-iron": (21279, 1000), "cases/lucky-iron-2": (21275, 1000),
    "cases/postit": (25758, 1000), "cases/postit-2": (25527, 1000),
    "cases/strava": (22111, 800), "cases/duolingo": (22175, 700),
}
for name, (xref, side) in ({} if "--vectors" in sys.argv else RASTERS).items():
    im = xref_image(xref)
    save_webp(im if im.mode in ("RGB", "RGBA") else im.convert("RGB"), OUT / f"{name}.webp", side)


# ---- vector illustrations ---------------------------------------------------
def render(page, clip, zoom=2.0):
    p = doc[page - 1]
    pix = p.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=fitz.Rect(*clip), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def trim(im, pad=12):
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda v: 255 if v > 18 else 0)
    box = diff.getbbox()
    if not box:
        return None
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def tallest_band(im, min_gap=14):
    """Keep the tallest horizontal band of ink: drops slide labels under an icon."""
    mask = ImageChops.difference(im, Image.new("RGB", im.size, "white")).convert("L").point(lambda v: 255 if v > 18 else 0)
    rows = [any(mask.getpixel((x, y)) for x in range(0, mask.width, 3)) for y in range(mask.height)]
    bands, start, gap = [], None, 0
    for y, on in enumerate(rows + [False] * (min_gap + 1)):
        if on:
            if start is None:
                start = y
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                bands.append((start, y - gap))
                start, gap = None, 0
    if not bands:
        return im
    a, b = max(bands, key=lambda t: t[1] - t[0])
    return trim(im.crop((0, a, im.width, b + 1))) or im


def to_alpha(im):
    """White background -> transparent, keeping soft edges."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = px[x, y]
            m = min(r, g, b)
            if m > 235:
                a = int(255 * (255 - m) / 20)
                px[x, y] = (r, g, b, max(0, min(255, a)))
    return rgba


def split_columns(im, min_gap=40, min_w=60):
    mask = ImageChops.difference(im, Image.new("RGB", im.size, "white")).convert("L").point(lambda v: 255 if v > 18 else 0)
    cols = [any(mask.getpixel((x, y)) for y in range(0, mask.height, 3)) for x in range(mask.width)]
    parts, start, gap = [], None, 0
    for x, on in enumerate(cols + [False] * (min_gap + 1)):
        if on:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                end = x - gap
                if end - start >= min_w:
                    parts.append(im.crop((start, 0, end + 1, im.height)))
                start, gap = None, 0
    return [t for t in (trim(p) for p in parts) if t]


# single illustrations: name -> (page, clip in slide px 1920x1080)
SINGLES = {
    "teacup": (4, (880, 330, 1620, 960)), "hourglass": (5, (930, 180, 1720, 960)),
    "calendar": (10, (840, 300, 1680, 920)), "question": (12, (640, 220, 1260, 610)),
    "teapot": (46, (1080, 280, 1680, 820)), "chai-cups": (57, (680, 200, 1220, 720)),
    "envelope": (85, (700, 160, 1400, 700)), "clipboard": (86, (760, 180, 1240, 540)),
    "globe": (89, (1560, 680, 1880, 1060)), "tiffin": (92, (730, 230, 1320, 820)),
"flowers": (121, (400, 180, 880, 940)),
    "donuts": (152, (1230, 280, 1780, 820)), "map": (29, (1300, 650, 1900, 1060)),
    "phone": (31, (1180, 560, 1700, 1000)), "cubes": (32, (1240, 520, 1760, 1000)),
    "food": (30, (1240, 560, 1800, 1060)), "containers": (126, (640, 180, 1300, 800)),
    "watering": (83, (560, 380, 1460, 1020)),
}
for name, (pg, clip) in SINGLES.items():
    t = trim(render(pg, clip))
    if t:
        save_webp(to_alpha(tallest_band(t)), OUT / f"icons/{name}.webp", 700)

# icon rows split into separate icons: name -> (page, clip, labels)
ROWS = {
    16: ((40, 300, 1880, 620), ["share", "superpower", "realfun", "guess"]),
    18: ((200, 330, 1740, 720), ["present", "user-room", "spaceship"]),
    44: ((40, 230, 1880, 560), ["journey", "ask", "emotion", "reflect"]),
    66: ((40, 220, 1880, 560), ["observe", "chai-them", "spill"]),
    71: ((40, 420, 1880, 760), ["look", "ask-why", "talk", "watch"]),
    87: ((40, 700, 1880, 1040), ["brief", "cards", "timer", "lead"]),
    133: ((40, 280, 1880, 640), ["draw", "circles", "beyond", "discuss"]),
    173: ((40, 180, 1880, 520), ["build", "test", "lens", "repeat"]),
}
report = {}
for pg, (clip, labels) in ROWS.items():
    parts = split_columns(render(pg, clip))
    report[pg] = len(parts)
    for lab, im in zip(labels, parts):
        save_webp(to_alpha(tallest_band(im)), OUT / f"icons/{lab}.webp", 500)


# ---- whole slides for the deck strip ----------------------------------------
SLIDES = [2, 8, 9, 10, 16, 18, 44, 62, 63, 71, 73, 87, 89, 103, 105, 107, 111, 129, 139, 142, 155, 162, 169, 173, 177, 187, 200, 206, 209, 213]
for pg in ([] if "--vectors" in sys.argv else SLIDES):
    p = doc[pg - 1]
    pix = p.get_pixmap(matrix=fitz.Matrix(0.5, 0.5), alpha=False)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    save_webp(im, OUT / f"slides/s{pg:03d}.webp", 960, 78)

print(json.dumps(report))

# Kit page extras
if "--vectors" not in sys.argv:
    save_webp(xref_image(2941).convert("RGB"), OUT / "deck/guidebook.webp", 1200)
    for pg in [19, 43, 90, 163]:
        p = doc[pg - 1]
        pix = p.get_pixmap(matrix=fitz.Matrix(0.5, 0.5), alpha=False)
        save_webp(Image.frombytes("RGB", (pix.width, pix.height), pix.samples), OUT / f"slides/s{pg:03d}.webp", 960, 78)
