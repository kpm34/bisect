#!/usr/bin/env python3
"""
Download Fabric PBR Textures from AmbientCG
Cotton, Leather, Wool, Cashmere, Silk, Denim
"""

import os
import requests
import zipfile
from pathlib import Path

# Target directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "fabric"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# AmbientCG fabric texture mappings
# Format: local_name -> AmbientCG asset ID
FABRIC_TEXTURES = {
    "cotton": "Fabric030",      # White cotton weave
    "leather": "Leather034",    # Brown leather
    "wool": "Fabric045",        # Wool knit texture
    "cashmere": "Fabric025",    # Fine soft fabric (cashmere-like)
    "silk": "Fabric026",        # Smooth silk-like
    "denim": "Fabric032",       # Blue denim weave
}

# Alternative mappings if primary not found
FABRIC_ALTERNATIVES = {
    "cotton": ["Fabric030", "Fabric029", "Fabric024"],
    "leather": ["Leather034", "Leather026", "Leather025"],
    "wool": ["Fabric045", "Fabric044", "Fabric043"],
    "cashmere": ["Fabric025", "Fabric026", "Fabric027"],
    "silk": ["Fabric026", "Fabric025", "Fabric028"],
    "denim": ["Fabric032", "Fabric031", "Fabric033"],
}

def download_ambientcg_texture(asset_id: str, output_folder: Path, resolution: str = "1K") -> bool:
    """Download a texture from AmbientCG"""

    # AmbientCG download URL format
    url = f"https://ambientcg.com/get?file={asset_id}_{resolution}-JPG.zip"

    print(f"  Downloading {asset_id} from AmbientCG...")

    try:
        response = requests.get(url, stream=True, timeout=60)

        if response.status_code != 200:
            print(f"  Failed to download {asset_id}: HTTP {response.status_code}")
            return False

        # Save zip file
        zip_path = output_folder / f"{asset_id}.zip"
        with open(zip_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Extract zip
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(output_folder)

        # Remove zip file
        zip_path.unlink()

        print(f"  ✓ Downloaded and extracted {asset_id}")
        return True

    except Exception as e:
        print(f"  Error downloading {asset_id}: {e}")
        return False


def organize_textures(output_folder: Path, fabric_name: str, asset_id: str):
    """Organize downloaded textures into proper folder structure"""

    fabric_folder = output_folder / fabric_name
    fabric_folder.mkdir(exist_ok=True)

    # Find and move texture files
    texture_types = {
        "Color": "diffuse",
        "Displacement": "displacement",
        "NormalGL": "normal",
        "Roughness": "roughness",
        "AmbientOcclusion": "ao",
    }

    for file in output_folder.glob(f"{asset_id}*"):
        if file.is_file() and file.suffix.lower() in ['.jpg', '.png']:
            # Determine texture type
            for tex_key, tex_name in texture_types.items():
                if tex_key in file.name:
                    new_name = f"{tex_name}{file.suffix}"
                    dest = fabric_folder / new_name
                    file.rename(dest)
                    print(f"    Moved {file.name} -> {fabric_name}/{new_name}")
                    break


def main():
    print("\n" + "=" * 60)
    print("Downloading Fabric PBR Textures from AmbientCG")
    print("=" * 60)

    success_count = 0

    for fabric_name, asset_id in FABRIC_TEXTURES.items():
        print(f"\n{fabric_name.upper()}:")

        # Try primary asset ID
        if download_ambientcg_texture(asset_id, OUTPUT_DIR):
            organize_textures(OUTPUT_DIR, fabric_name, asset_id)
            success_count += 1
        else:
            # Try alternatives
            alternatives = FABRIC_ALTERNATIVES.get(fabric_name, [])
            for alt_id in alternatives:
                if alt_id != asset_id:
                    print(f"  Trying alternative: {alt_id}")
                    if download_ambientcg_texture(alt_id, OUTPUT_DIR):
                        organize_textures(OUTPUT_DIR, fabric_name, alt_id)
                        success_count += 1
                        break

    print(f"\n\nDownloaded {success_count}/{len(FABRIC_TEXTURES)} fabric textures")
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
