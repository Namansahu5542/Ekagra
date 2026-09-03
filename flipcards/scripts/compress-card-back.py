from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/memory-match/assets/images/card-back.png')
target = Path('/home/ubuntu/memory-match/assets/images/card-back-mobile.jpg')

with Image.open(source) as image:
    image = image.convert('RGB')
    image.thumbnail((720, 720), Image.Resampling.LANCZOS)
    image.save(target, format='JPEG', quality=84, optimize=True, progressive=True)

print(f'compressed {source.stat().st_size} -> {target.stat().st_size} bytes')
