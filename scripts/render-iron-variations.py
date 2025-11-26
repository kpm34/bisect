#!/usr/bin/env python3
"""
Iron Variations Renderer - 5 key variations
"""

import bpy
import os
import math
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "iron-variations"

IRON_VARIATIONS = [
    {"id": "iron-polished", "name": "Polished Iron", "color": (0.55, 0.55, 0.56), "roughness": 0.15, "metalness": 1.0},
    {"id": "iron-cast", "name": "Cast Iron", "color": (0.25, 0.25, 0.27), "roughness": 0.6, "metalness": 0.9},
    {"id": "iron-wrought", "name": "Wrought Iron", "color": (0.20, 0.20, 0.22), "roughness": 0.5, "metalness": 0.85},
    {"id": "iron-brushed", "name": "Brushed Iron", "color": (0.45, 0.45, 0.48), "roughness": 0.4, "metalness": 1.0},
    {"id": "iron-rusted", "name": "Rusted", "color": (0.55, 0.30, 0.18), "roughness": 0.7, "metalness": 0.4},
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

    hdri_path = None
    blender_path = bpy.utils.resource_path('LOCAL')
    for path in [os.path.join(blender_path, "datafiles", "studiolights", "world", "interior.exr")]:
        if os.path.exists(path):
            hdri_path = path
            break

    node_background = nodes.new(type='ShaderNodeBackground')
    node_output = nodes.new(type='ShaderNodeOutputWorld')
    if hdri_path:
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

def create_material(variation):
    mat = bpy.data.materials.new(name=variation["id"])
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = (*variation["color"], 1.0)
        principled.inputs["Metallic"].default_value = variation["metalness"]
        principled.inputs["Roughness"].default_value = variation["roughness"]
        principled.inputs["IOR"].default_value = 2.5
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
    print("Iron Variations Renderer")
    print("=" * 50)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sphere = setup_scene()
    setup_render_settings()

    for i, v in enumerate(IRON_VARIATIONS, 1):
        print(f"[{i}/{len(IRON_VARIATIONS)}] {v['name']}")
        mat = create_material(v)
        if sphere.data.materials:
            sphere.data.materials[0] = mat
        else:
            sphere.data.materials.append(mat)
        bpy.context.scene.render.filepath = str(OUTPUT_DIR / f"{v['id']}.png")
        bpy.ops.render.render(write_still=True)

    print("Done!")

if __name__ == "__main__":
    main()
