import os
from PIL import Image

brain_dir = r"C:\Users\anumu\\.gemini\\antigravity-ide\\brain\\1ddae298-d1fd-479c-b8e0-c5124463e62b"
public_images_dir = r"c:\\Users\\anumu\\Downloads\\Manvithaa\\frontend\\public\\images"

os.makedirs(public_images_dir, exist_ok=True)

vehicles_screenshot_path = os.path.join(brain_dir, "media__1782146105273.png")

# Let's define the search regions for each vehicle card:
# Format: { "vehicle_name": (search_x1, search_y1, search_x2, search_y2) }
# On a 1024x682 image:
# Sidebar is on the left (~175px).
# Card 1 is at col 0, row 0.
# Card 5 is at col 0, row 1.
# Card width ~195px, height ~180px.
# Image is in the top right of each card.

card_regions = {
    "innova_crysta": (280, 275, 370, 335),       # Card 1 (TS09AB1234)
    "force_traveller": (485, 275, 575, 335),     # Card 2 (TS08XY5678)
    "tata_safari": (690, 275, 780, 335),         # Card 3 (TS11MN5678)
    "mahindra_xuv500": (895, 275, 985, 335),     # Card 4 (TS07KL4321)
    
    "innova_crysta_2": (280, 455, 370, 515),     # Card 5 (TS10PQ9876)
    "eicher_bus": (485, 455, 575, 515),          # Card 6 (TS12AB3456)
    "maruti_ertiga": (690, 455, 780, 515),       # Card 7 (TS09CD6789)
    "bharatbenz_bus": (895, 455, 985, 515)        # Card 8 (TS04EF1357)
}

def is_background(pixel):
    # The vehicle image background is white/very light grey.
    # In RGB, white is (255, 255, 255).
    # Let's treat anything with R > 250, G > 250, B > 250 as background.
    return pixel[0] > 250 and pixel[1] > 250 and pixel[2] > 250

def get_smart_bbox(img, region):
    x1, y1, x2, y2 = region
    
    min_x, min_y = x2, y2
    max_x, max_y = x1, y1
    
    found = False
    for y in range(y1, y2):
        for x in range(x1, x2):
            pixel = img.getpixel((x, y))
            if not is_background(pixel):
                found = True
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if found:
        # Add 2 pixels padding
        return (max(x1, min_x - 2), max(y1, min_y - 2), min(x2, max_x + 2), min(y2, max_y + 2))
    return region

if os.path.exists(vehicles_screenshot_path):
    with Image.open(vehicles_screenshot_path) as img:
        # Convert to RGB mode if not already
        rgb_img = img.convert("RGB")
        for name, region in card_regions.items():
            bbox = get_smart_bbox(rgb_img, region)
            car_img = rgb_img.crop(bbox)
            car_img.save(os.path.join(public_images_dir, f"{name}.png"))
            print(f"Smart cropped {name} from region {region} to bbox {bbox}")
else:
    print("Vehicles page screenshot not found.")
