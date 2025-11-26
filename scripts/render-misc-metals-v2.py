#!/usr/bin/env python3
"""
Misc Metals Renderer v2 - Focus on UNIQUE, visually distinct metals
No duplicates of what we already have (gold, silver, copper, iron, titanium)
"""

import bpy
import os
import math
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "misc-variations"

# Unique metals that look DIFFERENT from each other
MISC_METALS = [
    # Chrome - ultra reflective, distinct from silver
    {"id": "chrome", "name": "Chrome", "color": (0.98, 0.98, 1.0), "roughness": 0.0, "metalness": 1.0},

    # Brass - warm yellow-gold, distinct from gold (more yellow/greenish)
    {"id": "brass", "name": "Brass", "color": (0.85, 0.75, 0.30), "roughness": 0.15, "metalness": 1.0},

    # Bronze - darker, more brown than brass or copper
    {"id": "bronze", "name": "Bronze", "color": (0.55, 0.40, 0.25), "roughness": 0.25, "metalness": 1.0},

    # Gunmetal - dark bluish gray
    {"id": "gunmetal", "name": "Gunmetal", "color": (0.30, 0.32, 0.35), "roughness": 0.2, "metalness": 1.0},

    # Rose Gold (if not already covered well) - pinkish
    {"id": "rose-gold", "name": "Rose Gold", "color": (0.85, 0.55, 0.55), "roughness": 0.1, "metalness": 1.0},

    # Black Metal / Blackened Steel
    {"id": "black-metal", "name": "Black Metal", "color": (0.05, 0.05, 0.07), "roughness": 0.3, "metalness": 0.95},

    # Champagne - warm beige metallic
    {"id": "champagne", "name": "Champagne", "color": (0.92, 0.85, 0.70), "roughness": 0.15, "metalness": 1.0},

    # Midnight Blue - anodized dark blue
    {"id": "midnight-blue", "name": "Midnight Blue", "color": (0.12, 0.15, 0.30), "roughness": 0.2, "metalness": 0.85},

    # Emerald Green - anodized green
    {"id": "emerald", "name": "Emerald", "color": (0.10, 0.35, 0.25), "roughness": 0.2, "metalness": 0.85},

    # Matte Black
    {"id": "matte-black", "name": "Matte Black", "color": (0.03, 0.03, 0.03), "roughness": 0.6, "metalness": 0.9},

    # Pearl White - iridescent white
    {"id": "pearl", "name": "Pearl", "color": (0.95, 0.93, 0.90), "roughness": 0.2, "metalness": 0.7},

    # Rust Red - intentional red oxide look
    {"id": "rust-red", "name": "Rust Red", "color": (0.60, 0.20, 0.12), "roughness": 0.5, "metalness": 0.5},
]


def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=128, ring_count=64, location=(0, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "PreviewSphere"
    bpy.ops.object.shade_smooth()

    bpy.ops.object.camera_add(location=(3, -3, 2.5))
    camera = bpy.context.active_object
    camera.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = camera

    world = bpy.data.worlds.new("PreviewWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    blender_path = bpy.utils.resource_path('LOCAL')
    hdri_path = os.path.join(blender_path, "datafiles", "studiolights", "world", "interior.exr")

    node_background = nodes.new(type='ShaderNodeBackground')
    node_output = nodes.new(type='ShaderNodeOutputWorld')
    if os.path.exists(hdri_path):
        node_env = nodes.new(type='ShaderNodeTexEnvironment')
        node_env.image = bpy.data.images.load(hdri_path)
        links.new(node_env.outputs['Color'], node_background.inputs['Color'])
        node_background.inputs['Strength'].default_value = 1.0
    links.new(node_background.outputs['Background'], node_output.inputs['Surface'])

    for loc, energy, size, rot in [
        ((4, -2, 4), 200, 2, (45, 0, 30)),
        ((-3, -3, 2), 80, 3, (60, 0, -45)),
        ((0, 4, 2), 150, 2, (70, 0, 180))
    ]:
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.active_object
        light.data.energy = energy
        light.data.size = size
        light.rotation_euler = tuple(math.radians(r) for r in rot)

    return sphere


def create_material(v):
    mat = bpy.data.materials.new(name=v["id"])
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*v["color"], 1.0)
    principled.inputs["Metallic"].default_value = v["metalness"]
    principled.inputs["Roughness"].default_value = v["roughness"]
    principled.inputs["IOR"].default_value = 2.0

    # Add clearcoat for shiny ones
    if v["roughness"] < 0.15:
        principled.inputs["Coat Weight"].default_value = 0.5
        principled.inputs["Coat Roughness"].default_value = 0.05

    return mat


def setup_render_settings():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = True
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True


def main():
    print("\n" + "=" * 50)
    print("Misc Metals v2 - Unique & Diverse")
    print("=" * 50)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Clear old renders
    for f in OUTPUT_DIR.glob("*.png"):
        f.unlink()

    sphere = setup_scene()
    setup_render_settings()

    for i, v in enumerate(MISC_METALS, 1):
        print(f"[{i}/{len(MISC_METALS)}] {v['name']}")
        mat = create_material(v)
        if sphere.data.materials:
            sphere.data.materials[0] = mat
        else:
            sphere.data.materials.append(mat)
        bpy.context.scene.render.filepath = str(OUTPUT_DIR / f"{v['id']}.png")
        bpy.ops.render.render(write_still=True)

    print("\nDone!")

if __name__ == "__main__":
    main()
