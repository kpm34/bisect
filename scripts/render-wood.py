#!/usr/bin/env python3
"""
Wood Materials Renderer - 12 variations covering main types and alternatives
Uses procedural wood grain textures for realistic appearance
"""

import bpy
import os
import math
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "wood"

# 12 Wood variations - 5 main + 7 alternatives
WOOD_VARIATIONS = [
    # === 5 MAIN WOODS ===
    {
        "id": "oak",
        "name": "Oak",
        "base_color": (0.55, 0.40, 0.25),
        "dark_color": (0.35, 0.22, 0.12),
        "roughness": 0.45,
        "grain_scale": 8.0,
        "grain_detail": 6.0,
    },
    {
        "id": "walnut",
        "name": "Walnut",
        "base_color": (0.30, 0.18, 0.10),
        "dark_color": (0.15, 0.08, 0.05),
        "roughness": 0.35,
        "grain_scale": 10.0,
        "grain_detail": 8.0,
    },
    {
        "id": "maple",
        "name": "Maple",
        "base_color": (0.85, 0.70, 0.50),
        "dark_color": (0.70, 0.55, 0.35),
        "roughness": 0.30,
        "grain_scale": 12.0,
        "grain_detail": 4.0,
    },
    {
        "id": "cherry",
        "name": "Cherry",
        "base_color": (0.60, 0.30, 0.18),
        "dark_color": (0.40, 0.18, 0.10),
        "roughness": 0.30,
        "grain_scale": 10.0,
        "grain_detail": 5.0,
    },
    {
        "id": "pine",
        "name": "Pine",
        "base_color": (0.90, 0.75, 0.55),
        "dark_color": (0.75, 0.58, 0.38),
        "roughness": 0.50,
        "grain_scale": 6.0,
        "grain_detail": 3.0,
    },

    # === 7 ALTERNATIVE WOODS ===
    {
        "id": "mahogany",
        "name": "Mahogany",
        "base_color": (0.45, 0.18, 0.12),
        "dark_color": (0.28, 0.10, 0.06),
        "roughness": 0.25,
        "grain_scale": 12.0,
        "grain_detail": 6.0,
    },
    {
        "id": "ebony",
        "name": "Ebony",
        "base_color": (0.08, 0.06, 0.05),
        "dark_color": (0.02, 0.02, 0.02),
        "roughness": 0.20,
        "grain_scale": 15.0,
        "grain_detail": 10.0,
    },
    {
        "id": "birch",
        "name": "Birch",
        "base_color": (0.92, 0.85, 0.72),
        "dark_color": (0.80, 0.70, 0.55),
        "roughness": 0.40,
        "grain_scale": 8.0,
        "grain_detail": 3.0,
    },
    {
        "id": "teak",
        "name": "Teak",
        "base_color": (0.55, 0.38, 0.22),
        "dark_color": (0.38, 0.25, 0.12),
        "roughness": 0.35,
        "grain_scale": 7.0,
        "grain_detail": 5.0,
    },
    {
        "id": "ash",
        "name": "Ash",
        "base_color": (0.82, 0.72, 0.58),
        "dark_color": (0.60, 0.50, 0.38),
        "roughness": 0.40,
        "grain_scale": 6.0,
        "grain_detail": 7.0,
    },
    {
        "id": "rosewood",
        "name": "Rosewood",
        "base_color": (0.35, 0.15, 0.12),
        "dark_color": (0.18, 0.05, 0.05),
        "roughness": 0.25,
        "grain_scale": 14.0,
        "grain_detail": 8.0,
    },
    {
        "id": "bamboo",
        "name": "Bamboo",
        "base_color": (0.85, 0.78, 0.55),
        "dark_color": (0.70, 0.60, 0.40),
        "roughness": 0.35,
        "grain_scale": 4.0,
        "grain_detail": 2.0,
        "is_bamboo": True,  # Special linear grain pattern
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

    # Softer lighting for wood
    for loc, energy, size, rot in [
        ((4, -2, 4), 150, 2.5, (45, 0, 30)),
        ((-3, -3, 2), 60, 3.5, (60, 0, -45)),
        ((0, 4, 2), 120, 2.5, (70, 0, 180))
    ]:
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.active_object
        light.data.energy = energy
        light.data.size = size
        light.rotation_euler = tuple(math.radians(r) for r in rot)

    return sphere


def create_wood_material(v):
    """Create procedural wood material with grain pattern"""
    mat = bpy.data.materials.new(name=v["id"])
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    # Output
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (800, 0)

    # Principled BSDF
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.location = (500, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    # Texture coordinate
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)

    # Mapping for grain direction
    mapping = nodes.new(type='ShaderNodeMapping')
    mapping.location = (-600, 0)
    mapping.inputs['Scale'].default_value = (1.0, 1.0, 3.0)  # Stretch along Z for grain
    if v.get("is_bamboo"):
        mapping.inputs['Scale'].default_value = (1.0, 1.0, 8.0)  # More linear for bamboo
    links.new(tex_coord.outputs['Object'], mapping.inputs['Vector'])

    # Wave texture for wood grain bands
    wave = nodes.new(type='ShaderNodeTexWave')
    wave.location = (-400, 200)
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = v["grain_scale"]
    wave.inputs['Distortion'].default_value = 4.0 if not v.get("is_bamboo") else 1.0
    wave.inputs['Detail'].default_value = v["grain_detail"]
    wave.inputs['Detail Scale'].default_value = 1.5
    wave.inputs['Detail Roughness'].default_value = 0.6
    links.new(mapping.outputs['Vector'], wave.inputs['Vector'])

    # Noise for additional variation
    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.location = (-400, -100)
    noise.inputs['Scale'].default_value = 25.0
    noise.inputs['Detail'].default_value = 8.0
    noise.inputs['Roughness'].default_value = 0.6
    links.new(mapping.outputs['Vector'], noise.inputs['Vector'])

    # Mix wave and noise
    mix_factor = nodes.new(type='ShaderNodeMixRGB')
    mix_factor.location = (-200, 100)
    mix_factor.blend_type = 'MULTIPLY'
    mix_factor.inputs['Fac'].default_value = 0.3
    links.new(wave.outputs['Fac'], mix_factor.inputs['Color1'])
    links.new(noise.outputs['Fac'], mix_factor.inputs['Color2'])

    # Color ramp for grain contrast
    ramp = nodes.new(type='ShaderNodeValToRGB')
    ramp.location = (0, 100)
    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[0].color = (*v["dark_color"], 1.0)
    ramp.color_ramp.elements[1].position = 0.7
    ramp.color_ramp.elements[1].color = (*v["base_color"], 1.0)
    links.new(mix_factor.outputs['Color'], ramp.inputs['Fac'])

    # Connect color
    links.new(ramp.outputs['Color'], principled.inputs['Base Color'])

    # Roughness variation based on grain
    rough_ramp = nodes.new(type='ShaderNodeMapRange')
    rough_ramp.location = (200, -100)
    rough_ramp.inputs['From Min'].default_value = 0.0
    rough_ramp.inputs['From Max'].default_value = 1.0
    rough_ramp.inputs['To Min'].default_value = v["roughness"] - 0.05
    rough_ramp.inputs['To Max'].default_value = v["roughness"] + 0.1
    links.new(wave.outputs['Fac'], rough_ramp.inputs['Value'])
    links.new(rough_ramp.outputs['Result'], principled.inputs['Roughness'])

    # Wood is not metallic
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['IOR'].default_value = 1.5

    # Subtle subsurface for organic look
    principled.inputs['Subsurface Weight'].default_value = 0.05
    principled.inputs['Subsurface Radius'].default_value = (0.1, 0.05, 0.02)

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
    print(f"Wood Materials Renderer ({len(WOOD_VARIATIONS)} variations)")
    print("=" * 50)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sphere = setup_scene()
    setup_render_settings()

    for i, v in enumerate(WOOD_VARIATIONS, 1):
        print(f"[{i}/{len(WOOD_VARIATIONS)}] {v['name']}")
        mat = create_wood_material(v)
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
