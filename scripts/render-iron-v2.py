#!/usr/bin/env python3
"""
Iron Variations Renderer v2 - More interesting variations with procedural effects
"""

import bpy
import os
import math
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "iron-variations"

# More interesting iron variations
IRON_VARIATIONS = [
    {
        "id": "iron-polished",
        "name": "Polished Iron",
        "color": (0.55, 0.55, 0.56),
        "roughness": 0.12,
        "metalness": 1.0,
        "procedural": False
    },
    {
        "id": "iron-blackened",
        "name": "Blackened Iron",
        "color": (0.08, 0.08, 0.10),
        "roughness": 0.35,
        "metalness": 0.95,
        "procedural": False
    },
    {
        "id": "iron-galvanized",
        "name": "Galvanized",
        "color": (0.70, 0.72, 0.75),
        "color2": (0.60, 0.62, 0.65),
        "roughness": 0.25,
        "metalness": 1.0,
        "procedural": True,
        "noise_scale": 15.0,
        "noise_detail": 4.0,
        "mix_factor": 0.3
    },
    {
        "id": "iron-hammered",
        "name": "Hammered",
        "color": (0.35, 0.35, 0.38),
        "color2": (0.25, 0.25, 0.28),
        "roughness": 0.45,
        "roughness2": 0.6,
        "metalness": 0.9,
        "procedural": True,
        "noise_scale": 8.0,
        "noise_detail": 2.0,
        "mix_factor": 0.5
    },
    {
        "id": "iron-rusted",
        "name": "Rusted",
        "base_color": (0.45, 0.35, 0.30),
        "rust_color": (0.55, 0.25, 0.12),
        "rust_dark": (0.30, 0.15, 0.08),
        "roughness": 0.7,
        "metalness": 0.3,
        "procedural": "rust",
        "noise_scale": 5.0,
        "noise_detail": 10.0
    },
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


def create_simple_material(v):
    """Simple solid material"""
    mat = bpy.data.materials.new(name=v["id"])
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*v["color"], 1.0)
    principled.inputs["Metallic"].default_value = v["metalness"]
    principled.inputs["Roughness"].default_value = v["roughness"]
    principled.inputs["IOR"].default_value = 2.5
    return mat


def create_procedural_material(v):
    """Material with procedural noise variation"""
    mat = bpy.data.materials.new(name=v["id"])
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (600, 0)

    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    # Texture coordinate
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-600, 0)

    # Noise texture
    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = v.get("noise_scale", 10.0)
    noise.inputs['Detail'].default_value = v.get("noise_detail", 4.0)
    noise.location = (-400, 0)
    links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])

    # Color ramp
    ramp = nodes.new(type='ShaderNodeValToRGB')
    ramp.location = (-200, 100)
    ramp.color_ramp.elements[0].position = 0.4
    ramp.color_ramp.elements[1].position = 0.6
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])

    # Colors
    color1 = nodes.new(type='ShaderNodeRGB')
    color1.outputs[0].default_value = (*v["color"], 1.0)
    color1.location = (-200, 300)

    color2 = nodes.new(type='ShaderNodeRGB')
    color2.outputs[0].default_value = (*v.get("color2", v["color"]), 1.0)
    color2.location = (-200, 200)

    # Mix colors
    mix = nodes.new(type='ShaderNodeMixRGB')
    mix.location = (0, 200)
    mix.inputs['Fac'].default_value = v.get("mix_factor", 0.5)
    links.new(ramp.outputs['Color'], mix.inputs['Fac'])
    links.new(color1.outputs['Color'], mix.inputs['Color1'])
    links.new(color2.outputs['Color'], mix.inputs['Color2'])
    links.new(mix.outputs['Color'], principled.inputs['Base Color'])

    # Roughness variation
    if "roughness2" in v:
        rough_map = nodes.new(type='ShaderNodeMapRange')
        rough_map.location = (0, -100)
        rough_map.inputs['From Min'].default_value = 0
        rough_map.inputs['From Max'].default_value = 1
        rough_map.inputs['To Min'].default_value = v["roughness"]
        rough_map.inputs['To Max'].default_value = v["roughness2"]
        links.new(ramp.outputs['Color'], rough_map.inputs['Value'])
        links.new(rough_map.outputs['Result'], principled.inputs['Roughness'])
    else:
        principled.inputs['Roughness'].default_value = v["roughness"]

    principled.inputs['Metallic'].default_value = v["metalness"]
    principled.inputs['IOR'].default_value = 2.5

    return mat


def create_rust_material(v):
    """Realistic rust with procedural patches"""
    mat = bpy.data.materials.new(name=v["id"])
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (800, 0)

    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.location = (500, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    # Texture coordinate
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)

    # Main noise for rust pattern
    noise1 = nodes.new(type='ShaderNodeTexNoise')
    noise1.inputs['Scale'].default_value = v["noise_scale"]
    noise1.inputs['Detail'].default_value = v["noise_detail"]
    noise1.inputs['Roughness'].default_value = 0.7
    noise1.location = (-600, 100)
    links.new(tex_coord.outputs['Object'], noise1.inputs['Vector'])

    # Secondary noise for variation
    noise2 = nodes.new(type='ShaderNodeTexNoise')
    noise2.inputs['Scale'].default_value = v["noise_scale"] * 2.5
    noise2.inputs['Detail'].default_value = 6.0
    noise2.inputs['Roughness'].default_value = 0.5
    noise2.location = (-600, -100)
    links.new(tex_coord.outputs['Object'], noise2.inputs['Vector'])

    # Third noise for organic rust patches (replaces Musgrave)
    noise3 = nodes.new(type='ShaderNodeTexNoise')
    noise3.inputs['Scale'].default_value = 3.0
    noise3.inputs['Detail'].default_value = 12.0
    noise3.inputs['Roughness'].default_value = 0.8
    noise3.inputs['Distortion'].default_value = 1.5
    noise3.location = (-600, -300)
    links.new(tex_coord.outputs['Object'], noise3.inputs['Vector'])

    # Color ramp for main rust
    ramp1 = nodes.new(type='ShaderNodeValToRGB')
    ramp1.location = (-400, 100)
    ramp1.color_ramp.elements[0].position = 0.35
    ramp1.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp1.color_ramp.elements[1].position = 0.65
    ramp1.color_ramp.elements[1].color = (1, 1, 1, 1)
    links.new(noise1.outputs['Fac'], ramp1.inputs['Fac'])

    # Color ramp for detail
    ramp2 = nodes.new(type='ShaderNodeValToRGB')
    ramp2.location = (-400, -100)
    ramp2.color_ramp.elements[0].position = 0.4
    ramp2.color_ramp.elements[1].position = 0.7
    links.new(noise2.outputs['Fac'], ramp2.inputs['Fac'])

    # Base iron color
    base_color = nodes.new(type='ShaderNodeRGB')
    base_color.outputs[0].default_value = (*v["base_color"], 1.0)
    base_color.location = (-200, 300)

    # Rust color (orange-brown)
    rust_color = nodes.new(type='ShaderNodeRGB')
    rust_color.outputs[0].default_value = (*v["rust_color"], 1.0)
    rust_color.location = (-200, 200)

    # Dark rust color
    rust_dark = nodes.new(type='ShaderNodeRGB')
    rust_dark.outputs[0].default_value = (*v["rust_dark"], 1.0)
    rust_dark.location = (-200, 100)

    # Mix rust colors
    mix_rust = nodes.new(type='ShaderNodeMixRGB')
    mix_rust.location = (0, 150)
    links.new(ramp2.outputs['Color'], mix_rust.inputs['Fac'])
    links.new(rust_color.outputs['Color'], mix_rust.inputs['Color1'])
    links.new(rust_dark.outputs['Color'], mix_rust.inputs['Color2'])

    # Mix base with rust
    mix_final = nodes.new(type='ShaderNodeMixRGB')
    mix_final.location = (200, 200)
    links.new(ramp1.outputs['Color'], mix_final.inputs['Fac'])
    links.new(base_color.outputs['Color'], mix_final.inputs['Color1'])
    links.new(mix_rust.outputs['Color'], mix_final.inputs['Color2'])
    links.new(mix_final.outputs['Color'], principled.inputs['Base Color'])

    # Roughness - rustier = rougher
    rough_map = nodes.new(type='ShaderNodeMapRange')
    rough_map.location = (200, -50)
    rough_map.inputs['From Min'].default_value = 0
    rough_map.inputs['From Max'].default_value = 1
    rough_map.inputs['To Min'].default_value = 0.4
    rough_map.inputs['To Max'].default_value = 0.85
    links.new(ramp1.outputs['Color'], rough_map.inputs['Value'])
    links.new(rough_map.outputs['Result'], principled.inputs['Roughness'])

    # Metalness - rust is less metallic
    metal_map = nodes.new(type='ShaderNodeMapRange')
    metal_map.location = (200, -150)
    metal_map.inputs['From Min'].default_value = 0
    metal_map.inputs['From Max'].default_value = 1
    metal_map.inputs['To Min'].default_value = 0.8
    metal_map.inputs['To Max'].default_value = 0.15
    links.new(ramp1.outputs['Color'], metal_map.inputs['Value'])
    links.new(metal_map.outputs['Result'], principled.inputs['Metallic'])

    principled.inputs['IOR'].default_value = 1.5

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
    scene.cycles.samples = 256  # Higher for procedurals
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True


def main():
    print("\n" + "=" * 50)
    print("Iron Variations Renderer v2")
    print("=" * 50)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sphere = setup_scene()
    setup_render_settings()

    for i, v in enumerate(IRON_VARIATIONS, 1):
        print(f"[{i}/{len(IRON_VARIATIONS)}] {v['name']}")

        if v.get("procedural") == "rust":
            mat = create_rust_material(v)
        elif v.get("procedural"):
            mat = create_procedural_material(v)
        else:
            mat = create_simple_material(v)

        if sphere.data.materials:
            sphere.data.materials[0] = mat
        else:
            sphere.data.materials.append(mat)

        bpy.context.scene.render.filepath = str(OUTPUT_DIR / f"{v['id']}.png")
        bpy.ops.render.render(write_still=True)
        print(f"  -> {v['id']}.png")

    print("\nDone!")

if __name__ == "__main__":
    main()
