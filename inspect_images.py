import os
import json
from PIL import Image

brain_dir = r"C:\Users\anumu\.gemini\antigravity-ide\brain\1ddae298-d1fd-479c-b8e0-c5124463e62b"
files = os.listdir(brain_dir)
image_info = []

for file in files:
    if file.endswith(('.png', '.jpg', '.jpeg')):
        path = os.path.join(brain_dir, file)
        try:
            with Image.open(path) as img:
                w, h = img.size
                image_info.append({
                    "filename": file,
                    "width": w,
                    "height": h,
                    "format": img.format
                })
        except Exception as e:
            image_info.append({
                "filename": file,
                "error": str(e)
            })

print(json.dumps(image_info, indent=2))
