#!/usr/bin/env python3
"""Generate PWA app icons at various sizes using Pillow."""
import os
from PIL import Image, ImageDraw, ImageFont

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
COLOR = "#4f8cff"
ICON_DIR = os.path.dirname(os.path.abspath(__file__))


def create_icon(size):
    img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    margin = size // 8
    r = size // 4
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=r,
        fill=COLOR
    )

    # Draw sun circle
    cx, cy = size // 2, size // 2 - size // 10
    sun_r = size // 5
    draw.ellipse(
        [cx - sun_r, cy - sun_r, cx + sun_r, cy + sun_r],
        fill=(255, 255, 255, 230)
    )

    # Draw sun rays
    ray_len = size // 6
    for angle in range(0, 360, 30):
        import math
        rad = math.radians(angle)
        x1 = cx + int((sun_r + 2) * math.cos(rad))
        y1 = cy + int((sun_r + 2) * math.sin(rad))
        x2 = cx + int((sun_r + ray_len) * math.cos(rad))
        y2 = cy + int((sun_r + ray_len) * math.sin(rad))
        draw.line([x1, y1, x2, y2], fill=(255, 255, 255, 200), width=max(2, size // 24))

    # Draw cloud
    cloud_y = cy + size // 4
    cloud_r = size // 7
    draw.ellipse(
        [cx - cloud_r * 2, cloud_y - cloud_r, cx + cloud_r * 2, cloud_y + cloud_r],
        fill=(255, 255, 255, 200)
    )
    draw.ellipse(
        [cx - cloud_r, cloud_y - cloud_r - size // 12, cx + cloud_r, cloud_y + cloud_r],
        fill=(255, 255, 255, 230)
    )

    # Save
    path = os.path.join(ICON_DIR, f"icon-{size}.png")
    img.save(path, "PNG")
    print(f"  Created {path} ({size}x{size})")


def main():
    print("Generating WeatherView app icons...")
    for size in SIZES:
        create_icon(size)
    print(f"\nDone! Generated {len(SIZES)} icons in {ICON_DIR}")


if __name__ == "__main__":
    main()
