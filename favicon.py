from PIL import Image, ImageDraw

def create_wordbase_icon():
    # 1. Setup - Create a large canvas (512x512) for high quality downscaling
    size = 512
    # Brand Colors
    bg_color = (41, 128, 185)    # Belize Hole Blue (Professional, Trust)
    card_color = (236, 240, 241) # Clouds White
    shadow_color = (20, 80, 120) # Darker Blue for depth
    
    # Create the image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 2. Draw the Icon (A stack of 3 flashcards)
    
    # helper to draw rounded rectangle (simulated with standard rect for simplicity at small sizes)
    # Card 1 (Bottom - Shadow/Stack)
    margin_x = size * 0.2
    margin_y = size * 0.2
    
    # Bottom Card (Darkest, offset lowest)
    draw.rounded_rectangle(
        [(margin_x, margin_y + 80), (size - margin_x, size - margin_y + 80)],
        radius=40, fill=shadow_color
    )

    # Middle Card (Medium, offset middle)
    draw.rounded_rectangle(
        [(margin_x, margin_y + 40), (size - margin_x, size - margin_y + 40)],
        radius=40, fill=(bg_color) 
    )

    # Top Card (Bright White - The "Active" Word)
    # We make this one slightly smaller to show the stack behind it
    top_margin = 20
    draw.rounded_rectangle(
        [(margin_x + top_margin, margin_y), (size - margin_x - top_margin, size - margin_y)],
        radius=40, fill=card_color, outline=shadow_color, width=10
    )

    # 3. Add a "Text Line" hint on the top card (representing a word definition)
    line_color = (127, 140, 141) # Grey text lines
    
    # Line 1 (The "Word")
    draw.rectangle(
        [(size * 0.35, size * 0.4), (size * 0.65, size * 0.48)],
        fill=bg_color
    )
    
    # Line 2 (The "Definition")
    draw.rectangle(
        [(size * 0.35, size * 0.55), (size * 0.55, size * 0.58)],
        fill=line_color
    )

    # 4. Save as ICO
    # We resize the high-res image into standard favicon sizes
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (256, 256)]
    img.save('favicon.ico', format='ICO', sizes=icon_sizes)
    
    # Also save a PNG for use as an Apple Touch Icon or OG Image
    img.save('wordbase_logo.png', format='PNG')
    
    print("Success! Created 'favicon.ico' and 'wordbase_logo.png'")

if __name__ == "__main__":
    create_wordbase_icon()
