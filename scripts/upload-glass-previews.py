#!/usr/bin/env python3
"""
Upload glass material preview images to Supabase Storage
Updates database preview_url to point to CDN URLs
"""

import os
import requests
from pathlib import Path

# Supabase config
SUPABASE_URL = "https://vmawsauglaejrwfajnht.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYXdzYXVnbGFlanJ3ZmFqbmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTMwOTMsImV4cCI6MjA3OTY4OTA5M30.jauw5RD1xYlu4ICm13VejekGb93ePa_bwkz5Pgt9srw"
BUCKET = "material-previews"

BASE_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "glass"

# Glass folders to upload
GLASS_FOLDERS = ["clear", "tinted", "frosted", "matcap", "specialty"]


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


def update_preset_url(preset_id: str, preview_url: str) -> bool:
    """Update the material_presets table with the preview URL"""
    url = f"{SUPABASE_URL}/rest/v1/material_presets?id=eq.{preset_id}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    data = {"preview_url": preview_url}

    response = requests.patch(url, headers=headers, json=data)
    return response.status_code in [200, 204]


def get_presets_for_category(category_id: str) -> list:
    """Get all presets for the glass category"""
    url = f"{SUPABASE_URL}/rest/v1/material_presets?category_id=eq.{category_id}&select=id,slug"

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "apikey": SUPABASE_ANON_KEY
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return []


def main():
    print("\n" + "=" * 60)
    print("Uploading Glass Material Previews to Supabase Storage")
    print("=" * 60)

    # Glass category ID from Supabase
    GLASS_CATEGORY_ID = "5f1c5224-52e7-4504-b80f-9b26a315aec8"

    # Get all glass presets from database
    presets = get_presets_for_category(GLASS_CATEGORY_ID)
    preset_map = {p["slug"]: p["id"] for p in presets}
    print(f"\nFound {len(presets)} glass presets in database")

    total = 0
    success = 0
    updated = 0

    for folder in GLASS_FOLDERS:
        folder_path = BASE_DIR / folder
        if not folder_path.exists():
            print(f"\nSKIP: {folder}/ (not found)")
            continue

        print(f"\nglass/{folder}/")

        for png_file in folder_path.glob("*.png"):
            total += 1
            filename = png_file.name
            storage_path = f"glass/{folder}/{filename}"

            print(f"  Uploading {filename}...", end=" ")

            url = upload_file(png_file, storage_path)
            if url:
                print("OK", end="")
                success += 1

                # Update database with preview URL
                # Extract slug from filename (e.g., glass-clear-standard.png -> glass-clear-standard)
                slug = filename.replace(".png", "")
                if slug in preset_map:
                    if update_preset_url(preset_map[slug], url):
                        print(" [DB updated]")
                        updated += 1
                    else:
                        print(" [DB update failed]")
                else:
                    print(f" [No matching preset: {slug}]")
            else:
                print("FAILED")

    print(f"\n" + "=" * 60)
    print(f"Uploaded {success}/{total} files to storage")
    print(f"Updated {updated} database records")
    print(f"CDN URL format: {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/glass/...")
    print("=" * 60)


if __name__ == "__main__":
    main()
