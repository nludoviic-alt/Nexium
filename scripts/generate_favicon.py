from PIL import Image, ImageDraw

def create_nexium_icon(size=256):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rectangle
    margin = int(size * 0.04)
    radius = int(size * 0.22)
    
    # Dark obsidian background
    bg_box = [margin, margin, size - margin, size - margin]
    draw.rounded_rectangle(bg_box, radius=radius, fill=(7, 11, 20, 255), outline=(0, 255, 102, 100), width=max(1, int(size * 0.025)))

    # Scale coordinates for "N" Monogram
    w = size
    h = size
    
    # Left bar
    draw.polygon([
        (w * 0.26, h * 0.25),
        (w * 0.38, h * 0.25),
        (w * 0.38, h * 0.75),
        (w * 0.26, h * 0.75)
    ], fill=(0, 255, 102, 255))

    # Diagonal bar
    draw.polygon([
        (w * 0.35, h * 0.25),
        (w * 0.45, h * 0.25),
        (w * 0.74, h * 0.75),
        (w * 0.62, h * 0.75)
    ], fill=(0, 255, 102, 255))

    # Right bar
    draw.polygon([
        (w * 0.62, h * 0.25),
        (w * 0.74, h * 0.25),
        (w * 0.74, h * 0.75),
        (w * 0.62, h * 0.75)
    ], fill=(0, 255, 102, 255))

    # White accent node at top right
    node_r = max(2, int(size * 0.04))
    cx = int(w * 0.74)
    cy = int(h * 0.26)
    draw.ellipse([cx - node_r, cy - node_r, cx + node_r, cy + node_r], fill=(255, 255, 255, 255))

    return img

if __name__ == "__main__":
    icon256 = create_nexium_icon(256)
    icon128 = create_nexium_icon(128)
    icon64 = create_nexium_icon(64)
    icon32 = create_nexium_icon(32)
    icon16 = create_nexium_icon(16)

    # Save PNGs
    icon256.save("public/apple-touch-icon.png", format="PNG")
    icon64.save("public/favicon.png", format="PNG")
    icon32.save("public/favicon-32x32.png", format="PNG")
    icon16.save("public/favicon-16x16.png", format="PNG")

    # Save multi-resolution ICO
    icon256.save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print("Favicons generated successfully!")
