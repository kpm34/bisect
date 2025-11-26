#!/usr/bin/env python3
"""
Download Wood PBR Textures from AmbientCG (CC0 License)
Downloads 1K resolution for web use
"""

import os
import requests
import zipfile
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "wood" / "pbr"

# Curated wood textures covering our 12 variations
# Mapped to closest matches on AmbientCG
WOOD_TEXTURES = [
    # Main Woods
    {"id": "Wood051", "name": "oak", "display": "Oak"},  # Medium brown oak-like
    {"id": "Wood066", "name": "walnut", "display": "Walnut"},  # Dark brown
    {"id": "Wood049", "name": "maple", "display": "Maple"},  # Light blonde
    {"id": "Wood058", "name": "cherry", "display": "Cherry"},  # Reddish brown
    {"id": "Wood048", "name": "pine", "display": "Pine"},  # Light golden

    # Alternative Woods
    {"id": "Wood094", "name": "mahogany", "display": "Mahogany"},  # Rich dark
    {"id": "Wood027", "name": "ebony", "display": "Ebony"},  # Very dark
    {"id": "Wood050", "name": "birch", "display": "Birch"},  # Pale/light
    {"id": "Wood060", "name": "teak", "display": "Teak"},  # Golden brown
    {"id": "Wood052", "name": "ash", "display": "Ash"},  # Light tan
    {"id": "Wood067", "name": "rosewood", "display": "Rosewood"},  # Dark reddish
    {"id": "Wood026", "name": "bamboo", "display": "Bamboo"},  # Light linear
]


def download_texture(asset_id: str, name: str):
    """Download 1K PBR texture from AmbientCG"""
    output_path = OUTPUT_DIR / name
    output_path.mkdir(parents=True, exist_ok=True)

    # AmbientCG direct download URL format
    url = f"https://ambientcg.com/get?file={asset_id}_1K-JPG.zip"

    print(f"  Downloading {asset_id}...")
    response = requests.get(url, stream=True)

    if response.status_code != 200:
        print(f"  ERROR: Failed to download {asset_id} (status {response.status_code})")
        return False

    # Save zip
    zip_path = output_path / f"{asset_id}.zip"
    with open(zip_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    # Extract
    print(f"  Extracting...")
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(output_path)

    # Clean up zip
    zip_path.unlink()

    # Rename files to standard names
    for f in output_path.iterdir():
        if f.suffix.lower() in ['.jpg', '.png']:
            new_name = f.name.lower()
            if '_color' in new_name or '_diff' in new_name:
                f.rename(output_path / 'diffuse.jpg')
            elif '_normal' in new_name or '_nrm' in new_name:
                f.rename(output_path / 'normal.jpg')
            elif '_rough' in new_name:
                f.rename(output_path / 'roughness.jpg')
            elif '_disp' in new_name or '_height' in new_name:
                f.rename(output_path / 'displacement.jpg')
            elif '_ao' in new_name or '_ambient' in new_name:
                f.rename(output_path / 'ao.jpg')

    return True


def main():
    print("\n" + "=" * 50)
    print("Wood PBR Texture Downloader")
    print("Source: AmbientCG (CC0 License)")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    success = 0
    for i, tex in enumerate(WOOD_TEXTURES, 1):
        print(f"\n[{i}/{len(WOOD_TEXTURES)}] {tex['display']} ({tex['id']})")
        if download_texture(tex['id'], tex['name']):
            success += 1

    print(f"\n\nDownloaded {success}/{len(WOOD_TEXTURES)} textures")
    print(f"Location: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
