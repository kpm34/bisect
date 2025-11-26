#!/usr/bin/env python3
"""
Misc Metals Renderer - Chrome, Steel, Brass, Nickel, Zinc, Pewter, Aluminum
"""

import bpy
import os
import math
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "misc-variations"

MISC_METALS = [
    # Chrome
    {"id": "chrome-mirror", "name": "Chrome Mirror", "color": (0.95, 0.95, 0.97), "roughness": 0.0, "metalness": 1.0},
    {"id": "chrome-polished", "name": "Chrome Polished", "color": (0.90, 0.90, 0.93), "roughness": 0.08, "metalness": 1.0},
    {"id": "chrome-brushed", "name": "Chrome Brushed", "color": (0.85, 0.85, 0.88), "roughness": 0.3, "metalness": 1.0},

    # Steel
    {"id": "steel-polished", "name": "Polished Steel", "color": (0.78, 0.78, 0.80), "roughness": 0.1, "metalness": 1.0},
    {"id": "steel-brushed", "name": "Brushed Steel", "color": (0.70, 0.70, 0.73), "roughness": 0.35, "metalness": 1.0},
    {"id": "steel-stainless", "name": "Stainless Steel", "color": (0.75, 0.75, 0.78), "roughness": 0.2, "metalness": 1.0},

    # Brass
    {"id": "brass-polished", "name": "Polished Brass", "color": (0.88, 0.73, 0.35), "roughness": 0.1, "metalness": 1.0},
    {"id": "brass-antique", "name": "Antique Brass", "color": (0.70, 0.55, 0.28), "roughness": 0.4, "metalness": 0.85},
    {"id": "brass-brushed", "name": "Brushed Brass", "color": (0.82, 0.68, 0.32), "roughness": 0.35, "metalness": 1.0},

    # Nickel
    {"id": "nickel-polished", "name": "Polished Nickel", "color": (0.80, 0.78, 0.75), "roughness": 0.1, "metalness": 1.0},
    {"id": "nickel-satin", "name": "Satin Nickel", "color": (0.75, 0.73, 0.70), "roughness": 0.3, "metalness": 1.0},

    # Aluminum
    {"id": "aluminum-polished", "name": "Polished Aluminum", "color": (0.88, 0.88, 0.90), "roughness": 0.1, "metalness": 1.0},
    {"id": "aluminum-brushed", "name": "Brushed Aluminum", "color": (0.80, 0.80, 0.82), "roughness": 0.35, "metalness": 1.0},
    {"id": "aluminum-anodized", "name": "Anodized Aluminum", "color": (0.20, 0.20, 0.22), "roughness": 0.25, "metalness": 0.9},

    # Pewter & Zinc
    {"id": "pewter", "name": "Pewter", "color": (0.55, 0.55, 0.58), "roughness": 0.4, "metalness": 0.9},
    {"id": "zinc", "name": "Zinc", "color": (0.72, 0.72, 0.75), "roughness": 0.35, "metalness": 1.0},
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
    print("Misc Metals Renderer (17 variations)")
    print("=" * 50)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
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
