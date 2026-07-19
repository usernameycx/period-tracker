"""Render the FayeTide logo — Lunar Tidal philosophy.
Generates a museum-quality artifact: logo mark + scientific-diagram composition.
Pure Pillow — no external dependencies beyond Pillow."""

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

# ── Output ──────────────────────────────────────────────────
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fayetide-logo.png")
W, H = 1200, 1200

# ── Palette (Lunar Tidal: deep indigo + rose + parchment) ───
DEEP_INDIGO  = (27, 27, 58)       # #1B1B3A
MID_INDIGO   = (40, 40, 80)       # slightly lighter
ROSE         = (255, 105, 180)    # #FF69B4 — brand pink
ROSE_SOFT    = (255, 182, 193)    # #FFB6C1
ROSE_PALE    = (255, 220, 230)    # tinted rose
PARCHMENT    = (248, 243, 235)    # warm cream
PARCHMENT_DK = (225, 218, 205)    # slightly darker
INK          = (50, 45, 55)       # near-black with warmth
INK_LIGHT    = (140, 135, 145)    # muted annotation ink
GOLD_DIM     = (180, 155, 120)    # subtle gold for reference markers

# ── Create canvas ────────────────────────────────────────────
im = Image.new('RGB', (W, H), PARCHMENT)
draw = ImageDraw.Draw(im, 'RGBA')

# ── Helper: draw a precise circle ───────────────────────────
def circle(cx, cy, r, fill=None, outline=None, width=1):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill, outline=outline, width=width)

# ── Helper: draw an arc ─────────────────────────────────────
def arc(cx, cy, r, start_deg, end_deg, fill=None, outline=None, width=1):
    bbox = [cx - r, cy - r, cx + r, cy + r]
    # Pillow arc: 0=3oclock, goes clockwise
    start_rad = math.radians(start_deg - 90)
    end_rad = math.radians(end_deg - 90)
    draw.arc(bbox, math.degrees(start_rad), math.degrees(end_rad), fill=outline, width=width)

# ── Helper: smooth wave path between two points ──────────────
def wave_points(cx, cy, r, num_pts=200, amplitude=0.08, frequency=3):
    """Generate points along a horizontal diameter of the circle, with wave perturbation."""
    pts = []
    for i in range(num_pts):
        t = i / (num_pts - 1)  # 0 to 1
        x = cx - r + 2 * r * t
        # Base y is center line; wave perturbation
        wave = amplitude * r * math.sin(frequency * math.pi * t)
        y = cy + wave
        pts.append((x, y))
    return pts

# ── 1. Background texture: subtle grain pattern ─────────────
# Add very faint noise for paper texture
import random
random.seed(42)
for _ in range(30000):
    x = random.randint(0, W - 1)
    y = random.randint(0, H - 1)
    r, g, b = im.getpixel((x, y))
    noise = random.randint(-4, 4)
    im.putpixel((x, y), (
        max(0, min(255, r + noise)),
        max(0, min(255, g + noise)),
        max(0, min(255, b + noise)),
    ))

draw = ImageDraw.Draw(im, 'RGBA')  # re-create after pixel ops

# ── 2. Reference grid: faint circular guidelines ────────────
cx, cy = W // 2, H // 2
for i in range(1, 8):
    r = 80 + i * 60
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(150, 140, 130, 30), width=1)

# Crosshair guidelines
draw.line([(cx - 480, cy), (cx + 480, cy)], fill=(150, 140, 130, 20), width=1)
draw.line([(cx, cy - 480), (cx, cy + 480)], fill=(150, 140, 130, 20), width=1)

# ── 3. Main Logo Mark — The Tidal Moon ──────────────────────
LOGO_R = 180  # radius of main mark
# Outer glow (atmospheric depth)
for i in range(12, 0, -1):
    alpha = 3
    circle(cx, cy, LOGO_R + i, outline=(180, 160, 140, alpha), width=1)

# Background circle — deep indigo
circle(cx, cy, LOGO_R, fill=DEEP_INDIGO)

# Create a clipping mask effect: draw the wave division
# Upper portion: slightly lighter indigo with crescent
# Lower portion: rose pink
# The wave divide

# Draw the wave path points within the circle
wave_pts = wave_points(cx, cy, LOGO_R, num_pts=300, amplitude=0.07, frequency=2.5)

# Draw the wave line — cream color, precise
for i in range(len(wave_pts) - 1):
    x1, y1 = wave_pts[i]
    x2, y2 = wave_pts[i + 1]
    # Only draw if within circle
    d1 = math.sqrt((x1 - cx)**2 + (y1 - cy)**2)
    d2 = math.sqrt((x2 - cx)**2 + (y2 - cy)**2)
    if d1 <= LOGO_R and d2 <= LOGO_R:
        draw.line([(x1, y1), (x2, y2)], fill=ROSE_SOFT, width=3)

# Fill the lower portion with rose gradient
# We'll draw horizontal slices from wave to bottom of circle
for y_offset in range(0, 2 * LOGO_R, 1):
    y = cy - LOGO_R + y_offset
    # Find the wave Y at this X range — simplified: we know wave is near center
    # Find intersection of this horizontal line with the circle
    dy = y - cy
    if abs(dy) >= LOGO_R:
        continue
    half_chord = math.sqrt(LOGO_R**2 - dy**2)

    # Wave position at this y level
    # For each pixel x in the chord, determine if it's above or below the wave
    wave_y_at_center = cy + 0.07 * LOGO_R * math.sin(2.5 * math.pi * 0.5)

    # Simple approach: draw the lower part as tinted
    if y > wave_y_at_center:
        # Rose tint — stronger at bottom
        ratio = (y - wave_y_at_center) / (LOGO_R * 1.5)
        ratio = max(0, min(1, ratio))
        r_val = int(DEEP_INDIGO[0] + (ROSE[0] - DEEP_INDIGO[0]) * ratio * 0.85)
        g_val = int(DEEP_INDIGO[1] + (ROSE[1] - DEEP_INDIGO[1]) * ratio * 0.85)
        b_val = int(DEEP_INDIGO[2] + (ROSE[2] - DEEP_INDIGO[2]) * ratio * 0.85)
        color = (r_val, g_val, b_val)

        x_start = int(cx - half_chord)
        x_end = int(cx + half_chord)
        if x_end - x_start > 0:
            draw.line([(x_start, y), (x_end, y)], fill=color, width=1)

# Re-draw the circle border for crispness
circle(cx, cy, LOGO_R, outline=(60, 55, 75), width=2)

# ── 4. Crescent moon detail ──────────────────────────────────
# Small crescent in upper portion of the logo
crescent_cx = cx + LOGO_R * 0.35
crescent_cy = cy - LOGO_R * 0.35
crescent_r = LOGO_R * 0.22

# Draw crescent: two overlapping circles
# Outer circle (the moon body) — rose
circle(crescent_cx, crescent_cy, crescent_r, fill=ROSE_SOFT)
# Inner circle offset to create crescent cut
circle(crescent_cx + crescent_r * 0.4, crescent_cy - crescent_r * 0.15, crescent_r * 0.78, fill=DEEP_INDIGO)

# ── 5. Orbital dots — moon phase markers along orbit ─────────
orbit_r = LOGO_R + 40
for i in range(8):
    angle = math.radians(i * 45 - 90)
    ox = cx + orbit_r * math.cos(angle)
    oy = cy + orbit_r * math.sin(angle)
    # Phase dots: full → crescent → empty → crescent
    dot_r = 4 + (i % 3) * 2
    circle(int(ox), int(oy), dot_r, fill=GOLD_DIM if i % 4 != 3 else ROSE)

# ── 6. Tidal measurement marks ───────────────────────────────
# Horizontal measurement lines below the logo
tide_base_y = cy + LOGO_R + 80
for i in range(13):
    x = cx - 180 + i * 30
    h = 6 + abs(6 - i) * 4  # V-shaped heights
    draw.line([(x, tide_base_y), (x, tide_base_y - h)], fill=INK_LIGHT, width=1)

draw.line([(cx - 185, tide_base_y), (cx + 185, tide_base_y)], fill=INK_LIGHT, width=1)

# ── 7. Scientific-diagram reference marks ────────────────────
# Small annotation lines with numbers
annotations = [
    (cx - LOGO_R - 50, cy, "R1", "29.530", "SYNODIC"),
    (cx, cy - LOGO_R - 35, "P1", "14.765", "QUADRATURE"),
    (cx + LOGO_R + 25, cy + LOGO_R * 0.35, "T1", "12.420", "SEMIDIURNAL"),
]

for ax, ay, ref_id, measurement, label in annotations:
    # Leader line
    dx = cx - ax
    dy = cy - ay
    dist = math.sqrt(dx**2 + dy**2)
    if dist > 0:
        ux, uy = dx / dist, dy / dist
        end_x = ax + ux * 30
        end_y = ay + uy * 30
        draw.line([(ax, ay), (end_x, end_y)], fill=INK_LIGHT, width=1)
        # Small circle at endpoint
        circle(int(end_x), int(end_y), 2, fill=INK_LIGHT)

    # Reference ID in small type
    draw.text((ax - 25, ay - 18), ref_id, fill=INK_LIGHT, font=None)
    draw.text((ax - 25, ay - 6), measurement, fill=INK_LIGHT, font=None)
    draw.text((ax - 25, ay + 6), label, fill=INK_LIGHT, font=None)

# ── 8. Typography — title ────────────────────────────────────
# We can't guarantee fonts, so draw a precise text element
# Place "FAYETIDE" at top center
title_y = cy - LOGO_R - 110
draw.text((cx - 80, title_y), "F A Y E T I D E", fill=INK, font=None)

# Subtitle
subtitle_y = title_y + 30
draw.text((cx - 130, subtitle_y), "LUNAR TIDAL OBSERVATORY", fill=INK_LIGHT, font=None)

# Bottom text
bottom_y = tide_base_y + 50
draw.text((cx - 75, bottom_y), "PLATE NO. 001", fill=INK_LIGHT, font=None)
draw.text((cx - 60, bottom_y + 18), "OBS. DATE —", fill=INK_LIGHT, font=None)

# ── 9. Corner markers — scientific plate framing ─────────────
corner_margin = 40
corner_len = 50
for cx_c, cy_c in [(corner_margin, corner_margin), (W - corner_margin, corner_margin),
                    (corner_margin, H - corner_margin), (W - corner_margin, H - corner_margin)]:
    dx = 1 if cx_c < W // 2 else -1
    dy = 1 if cy_c < H // 2 else -1
    draw.line([(cx_c, cy_c), (cx_c + dx * corner_len, cy_c)], fill=INK_LIGHT, width=1)
    draw.line([(cx_c, cy_c), (cx_c, cy_c + dy * corner_len)], fill=INK_LIGHT, width=1)

# Registration marks at top corners
draw.text((corner_margin + 60, corner_margin + 5), "↻", fill=INK_LIGHT, font=None)
draw.text((W - corner_margin - 72, corner_margin + 5), "↺", fill=INK_LIGHT, font=None)

# ── 10. Moon phase strip at bottom ───────────────────────────
phase_y = bottom_y + 55
phase_centers = []
for i in range(29):
    px = 60 + i * 38
    phase_centers.append(px)
    # Phase disk
    r_p = 10
    circle(px, int(phase_y), r_p, outline=INK_LIGHT, width=1)

    # Illumination pattern (full→waning→new→waxing→full)
    illum = abs(14.5 - i) / 14.5  # 0=new, 1=full
    if i < 14.5:
        # Waning: light on right
        fill_w = max(0, int(255 * (1 - illum)))
        draw.ellipse([px - r_p + r_p * illum, phase_y - r_p, px + r_p, phase_y + r_p], fill=INK_LIGHT)
    else:
        # Waxing: light on left
        fill_w = max(0, int(255 * (1 - illum)))
        draw.ellipse([px - r_p, phase_y - r_p, px + r_p - r_p * illum, phase_y + r_p], fill=INK_LIGHT)

    # Special markers
    if i == 0:
        draw.text((px - 12, int(phase_y) - 28), "NEW", fill=ROSE, font=None)
    elif i == 7:
        draw.text((px - 12, int(phase_y) - 28), "Q1", fill=INK_LIGHT, font=None)
    elif i == 14:
        draw.text((px - 12, int(phase_y) + 14), "FULL", fill=INK_LIGHT, font=None)
    elif i == 21:
        draw.text((px - 12, int(phase_y) + 14), "Q3", fill=INK_LIGHT, font=None)

# ── 11. Subtle decorative elements ───────────────────────────
# Small constellation dots in the background
star_positions = [
    (cx - 300, cy - 250), (cx + 280, cy - 300), (cx + 350, cy - 150),
    (cx - 350, cy + 100), (cx - 200, cy + 350), (cx + 300, cy + 280),
    (cx + 180, cy - 380), (cx - 380, cy - 80),
]
# Connect some with faint lines
for i in range(0, len(star_positions) - 1, 2):
    x1, y1 = star_positions[i]
    x2, y2 = star_positions[i + 1]
    draw.line([(x1, y1), (x2, y2)], fill=(180, 170, 155, 15), width=1)

for sx, sy in star_positions:
    r_star = 2 + random.randint(0, 2)
    circle(sx, sy, r_star, fill=GOLD_DIM)

# ── Save ─────────────────────────────────────────────────────
# Apply very subtle blur to the whole image for atmospheric depth
im = im.filter(ImageFilter.GaussianBlur(0.3))
im.save(OUT, 'PNG', dpi=(300, 300))
print(f"Logo saved to {OUT}")
print(f"Dimensions: {W}x{H}")
