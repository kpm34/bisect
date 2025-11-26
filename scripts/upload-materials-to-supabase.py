#!/usr/bin/env python3
"""
Upload material preview images to Supabase Storage
Updates database preview_url to point to CDN URLs
"""

import os
import requests
from pathlib import Path

# Supabase config
SUPABASE_URL = "https://vmawsauglaejrwfajnht.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYXdzYXVnbGFlanJ3ZmFqbmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTMwOTMsImV4cCI6MjA3OTY4OTA5M30.jauw5RD1xYlu4ICm13VejekGb93ePa_bwkz5Pgt9srw"
BUCKET = "material-previews"

BASE_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials"

# Material folders and their files
MATERIAL_STRUCTURE = {
    "metal/gold-variations": ["gold-mirror.png", "gold-polished.png", "gold-satin.png", "gold-brushed.png", "gold-matte.png",
                              "gold-rose.png", "gold-white.png", "gold-champagne.png", "gold-rich.png", "gold-pale.png",
                              "gold-aged.png", "gold-antique.png", "gold-dark.png", "gold-worn.png", "gold-roughcast.png"],
    "metal/silver-variations": ["silver-mirror.png", "silver-polished.png", "silver-satin.png", "silver-brushed.png", "silver-matte.png",
                                "silver-sterling.png", "silver-bright.png", "silver-warm.png", "silver-cool.png", "silver-gunmetal.png",
                                "silver-tarnished.png", "silver-antique.png", "silver-oxidized.png", "silver-patina.png", "silver-weathered.png"],
    "metal/copper-variations": ["copper-mirror.png", "copper-polished.png", "copper-satin.png", "copper-brushed.png", "copper-matte.png",
                                "copper-rose.png", "copper-bright.png", "copper-warm.png", "copper-penny.png", "copper-bronze.png",
                                "copper-oxidized.png", "copper-aged.png", "copper-weathered.png"],
    "metal/iron-variations": ["iron-polished.png", "iron-blackened.png", "iron-galvanized.png", "iron-hammered.png", "iron-rusted.png"],
    "metal/titanium-variations": ["titanium-polished.png", "titanium-brushed.png", "titanium-matte.png", "titanium-blue.png", "titanium-purple.png"],
    "metal/misc-variations": ["chrome.png", "black-metal.png", "midnight-blue.png", "emerald.png", "matte-black.png", "pearl.png"],
    "wood": ["oak.png", "walnut.png", "maple.png", "cherry.png", "pine.png",
             "mahogany.png", "ebony.png", "birch.png", "teak.png", "ash.png", "rosewood.png", "bamboo.png"],
}


def upload_file(local_path: Path, storage_path: str) -> str:
    """Upload file to Supabase Storage and return public URL"""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"

    with open(local_path, 'rb') as f:
        content = f.read()

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true"  # Overwrite if exists
    }

    response = requests.post(url, headers=headers, data=content)

    if response.status_code in [200, 201]:
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
        return public_url
    else:
        print(f"  ERROR: {response.status_code} - {response.text}")
        return None


def main():
    print("\n" + "=" * 60)
    print("Uploading Material Previews to Supabase Storage")
    print("=" * 60)

    total = 0
    success = 0

    for folder, files in MATERIAL_STRUCTURE.items():
        print(f"\n{folder}/")
        local_folder = BASE_DIR / folder

        for filename in files:
            local_path = local_folder / filename
            storage_path = f"{folder}/{filename}"

            if not local_path.exists():
                print(f"  SKIP: {filename} (not found)")
                continue

            total += 1
            print(f"  Uploading {filename}...", end=" ")

            url = upload_file(local_path, storage_path)
            if url:
                print("OK")
                success += 1
            else:
                print("FAILED")

    print(f"\n\nUploaded {success}/{total} files")
    print(f"CDN URL format: {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/...")


if __name__ == "__main__":
    main()
