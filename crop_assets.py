import os
from PIL import Image

brain_dir = r"C:\Users\anumu\\.gemini\\antigravity-ide\\brain\\1ddae298-d1fd-479c-b8e0-c5124463e62b"
public_images_dir = r"c:\\Users\\anumu\\Downloads\\Manvithaa\\frontend\\public\\images"

os.makedirs(public_images_dir, exist_ok=True)

# 1. Crop Login Page Promo Panel from media__1782146468844.jpg
# Dimensions: 1024 x 768. Left panel is approx 45.6% of width
login_screenshot_path = os.path.join(brain_dir, "media__1782146468844.jpg")
if os.path.exists(login_screenshot_path):
    with Image.open(login_screenshot_path) as img:
        # Crop left promo panel (0 to 466 px width, full height)
        promo_img = img.crop((0, 0, 467, 768))
        promo_img.save(os.path.join(public_images_dir, "login_promo_cropped.png"))
        print("Cropped login promo panel successfully.")
else:
    print("Login page screenshot not found.")

# 2. Crop Vehicle Images from Vehicles Page (media__1782146105273.png)
# Dimensions: 1024 x 682.
# Let's inspect where the vehicle images are located inside the cards:
# The card grid is located in the middle-bottom area.
# Let's write a python script to crop 8 bounding boxes representing the car images.
vehicles_screenshot_path = os.path.join(brain_dir, "media__1782146105273.png")

# Bounding boxes for the 8 vehicles (x1, y1, x2, y2)
# We can estimate coordinates based on a 1024x682 layout:
# Card grid starts around y=260 and ends around y=615
# Row 1 is approx y=260 to y=440
# Row 2 is approx y=440 to y=615
# Column widths: each card has width approx 200px
# Let's write a script to crop specific regions for the 8 cars
# We'll save them as: innova_crysta.png, force_traveller.png, etc.

crops = {
    "innova_crysta": (290, 290, 355, 340),      # Card 1 top-right
    "force_traveller": (490, 290, 560, 340),    # Card 2 top-right
    "tata_safari": (690, 290, 760, 340),        # Card 3 top-right
    "mahindra_xuv500": (895, 290, 960, 340),    # Card 4 top-right
    
    "innova_crysta_2": (290, 465, 355, 515),    # Card 5 top-right
    "eicher_bus": (490, 465, 560, 515),         # Card 6 top-right
    "maruti_ertiga": (690, 465, 760, 515),      # Card 7 top-right
    "bharatbenz_bus": (890, 465, 960, 515)       # Card 8 top-right
}

if os.path.exists(vehicles_screenshot_path):
    with Image.open(vehicles_screenshot_path) as img:
        for name, bbox in crops.items():
            # Adjust coordinates if needed (we can run a search or just crop)
            car_img = img.crop(bbox)
            car_img.save(os.path.join(public_images_dir, f"{name}.png"))
        print("Cropped vehicle images successfully.")
else:
    print("Vehicles page screenshot not found.")
