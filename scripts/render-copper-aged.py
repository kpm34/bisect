#!/usr/bin/env python3
"""
Copper Aged Variations Renderer (with procedural weathering)

Renders aged copper materials with realistic oxidation, patina, and weathering effects.
Uses procedural noise textures for realistic surface variation.

Run with: /path/to/blender --background --python render-copper-aged.py
"""

import bpy
import os
import math
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "copper-variations"

# Aged copper variations with procedural settings
AGED_VARIATIONS = [
    {
        "id": "copper-oxidized",
        "name": "Oxidized",
        "base_color": (0.45, 0.28, 0.20),      # Dark brown copper
        "oxidation_color": (0.15, 0.12, 0.10), # Near-black tarnish
        "roughness_base": 0.4,
        "roughness_variation": 0.3,
        "metalness": 0.75,
        "noise_scale": 4.0,
        "noise_detail": 8.0,
        "mix_factor": 0.5,
    },
    {
        "id": "copper-patina",
        "name": "Green Patina",
        "base_color": (0.55, 0.38, 0.28),      # Aged copper base
        "oxidation_color": (0.25, 0.55, 0.45), # Turquoise green patina
        "roughness_base": 0.5,
        "roughness_variation": 0.25,
        "metalness": 0.3,
        "noise_scale": 3.0,
        "noise_detail": 6.0,
        "mix_factor": 0.65,
    },
    {
        "id": "copper-verdigris",
        "name": "Verdigris",
        "base_color": (0.50, 0.35, 0.25),      # Copper underneath
        "oxidation_color": (0.20, 0.50, 0.48), # Blue-green verdigris
        "roughness_base": 0.55,
        "roughness_variation": 0.3,
        "metalness": 0.35,
        "noise_scale": 5.0,
        "noise_detail": 10.0,
        "mix_factor": 0.7,
    },
    {
        "id": "copper-weathered",
        "name": "Weathered",
        "base_color": (0.65, 0.42, 0.32),      # Faded copper
        "oxidation_color": (0.35, 0.25, 0.18), # Dark weathered spots
        "roughness_base": 0.45,
        "roughness_variation": 0.35,
        "metalness": 0.65,
        "noise_scale": 6.0,
        "noise_detail": 12.0,
        "mix_factor": 0.45,
    },
]


def setup_scene():
    """Setup a clean scene with proper lighting for material preview"""
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Create sphere with more subdivisions for better texture detail
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0,
        segments=128,
        ring_count=64,
        location=(0, 0, 0)
    )
    sphere = bpy.context.active_object
    sphere.name = "PreviewSphere"
    bpy.ops.object.shade_smooth()

    # Setup camera
    bpy.ops.object.camera_add(location=(3, -3, 2.5))
    camera = bpy.context.active_object
    camera.name = "PreviewCamera"
    camera.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = camera

    # Setup world/environment
    world = bpy.data.worlds.new("PreviewWorld")
    bpy.context.scene.world = world
    world.use_nodes = True

    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    # Try to use built-in HDRI
    hdri_path = None
    blender_path = bpy.utils.resource_path('LOCAL')
    possible_hdris = [
        os.path.join(blender_path, "datafiles", "studiolights", "world", "interior.exr"),
        os.path.join(blender_path, "datafiles", "studiolights", "world", "city.exr"),
    ]

    for path in possible_hdris:
        if os.path.exists(path):
            hdri_path = path
            break

    node_background = nodes.new(type='ShaderNodeBackground')
    node_output = nodes.new(type='ShaderNodeOutputWorld')

    if hdri_path:
        node_environment = nodes.new(type='ShaderNodeTexEnvironment')
        node_environment.image = bpy.data.images.load(hdri_path)
        links.new(node_environment.outputs['Color'], node_background.inputs['Color'])
        node_background.inputs['Strength'].default_value = 1.0
        print(f"Using HDRI: {hdri_path}")
    else:
        node_background.inputs['Color'].default_value = (0.5, 0.55, 0.6, 1)
        node_background.inputs['Strength'].default_value = 1.5

    links.new(node_background.outputs['Background'], node_output.inputs['Surface'])

    # 3-point lighting
    bpy.ops.object.light_add(type='AREA', location=(4, -2, 4))
    key_light = bpy.context.active_object
    key_light.data.energy = 200
    key_light.data.size = 2
    key_light.rotation_euler = (math.radians(45), 0, math.radians(30))

    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
    fill_light = bpy.context.active_object
    fill_light.data.energy = 80
    fill_light.data.size = 3
    fill_light.rotation_euler = (math.radians(60), 0, math.radians(-45))

    bpy.ops.object.light_add(type='AREA', location=(0, 4, 2))
    rim_light = bpy.context.active_object
    rim_light.data.energy = 150
    rim_light.data.size = 2
    rim_light.rotation_euler = (math.radians(70), 0, math.radians(180))

    return sphere


def create_aged_copper_material(variation):
    """Create a procedural aged copper material with realistic weathering"""
    mat = bpy.data.materials.new(name=variation["id"])
    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Create output node
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (800, 0)

    # Create Principled BSDF
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.location = (500, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    # --- COLOR MIXING ---
    # Base copper color
    base_color = nodes.new(type='ShaderNodeRGB')
    base_color.outputs[0].default_value = (*variation["base_color"], 1.0)
    base_color.location = (-400, 200)

    # Oxidation/patina color
    oxidation_color = nodes.new(type='ShaderNodeRGB')
    oxidation_color.outputs[0].default_value = (*variation["oxidation_color"], 1.0)
    oxidation_color.location = (-400, 50)

    # Noise texture for variation
    noise_tex = nodes.new(type='ShaderNodeTexNoise')
    noise_tex.inputs['Scale'].default_value = variation["noise_scale"]
    noise_tex.inputs['Detail'].default_value = variation["noise_detail"]
    noise_tex.inputs['Roughness'].default_value = 0.6
    noise_tex.location = (-600, -100)

    # Texture coordinate
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-800, -100)
    links.new(tex_coord.outputs['Object'], noise_tex.inputs['Vector'])

    # Color ramp to control the noise distribution
    color_ramp = nodes.new(type='ShaderNodeValToRGB')
    color_ramp.location = (-400, -100)
    color_ramp.color_ramp.elements[0].position = 0.3
    color_ramp.color_ramp.elements[1].position = 0.7
    links.new(noise_tex.outputs['Fac'], color_ramp.inputs['Fac'])

    # Mix colors based on noise
    mix_color = nodes.new(type='ShaderNodeMixRGB')
    mix_color.blend_type = 'MIX'
    mix_color.location = (-100, 150)
    links.new(color_ramp.outputs['Color'], mix_color.inputs['Fac'])
    links.new(base_color.outputs['Color'], mix_color.inputs['Color1'])
    links.new(oxidation_color.outputs['Color'], mix_color.inputs['Color2'])

    # Overall mix factor control
    mix_factor = nodes.new(type='ShaderNodeMath')
    mix_factor.operation = 'MULTIPLY'
    mix_factor.inputs[1].default_value = variation["mix_factor"]
    mix_factor.location = (-250, -50)
    links.new(color_ramp.outputs['Color'], mix_factor.inputs[0])

    # Final color mix
    final_mix = nodes.new(type='ShaderNodeMixRGB')
    final_mix.blend_type = 'MIX'
    final_mix.location = (100, 150)
    final_mix.inputs['Fac'].default_value = variation["mix_factor"]
    links.new(mix_color.outputs['Color'], final_mix.inputs['Color1'])
    links.new(oxidation_color.outputs['Color'], final_mix.inputs['Color2'])
    links.new(color_ramp.outputs['Color'], final_mix.inputs['Fac'])

    links.new(mix_color.outputs['Color'], principled.inputs['Base Color'])

    # --- ROUGHNESS VARIATION ---
    roughness_noise = nodes.new(type='ShaderNodeTexNoise')
    roughness_noise.inputs['Scale'].default_value = variation["noise_scale"] * 1.5
    roughness_noise.inputs['Detail'].default_value = 4.0
    roughness_noise.location = (-400, -300)
    links.new(tex_coord.outputs['Object'], roughness_noise.inputs['Vector'])

    # Map noise to roughness range
    roughness_map = nodes.new(type='ShaderNodeMapRange')
    roughness_map.inputs['From Min'].default_value = 0.0
    roughness_map.inputs['From Max'].default_value = 1.0
    roughness_map.inputs['To Min'].default_value = variation["roughness_base"]
    roughness_map.inputs['To Max'].default_value = variation["roughness_base"] + variation["roughness_variation"]
    roughness_map.location = (-100, -300)
    links.new(roughness_noise.outputs['Fac'], roughness_map.inputs['Value'])
    links.new(roughness_map.outputs['Result'], principled.inputs['Roughness'])

    # --- METALNESS VARIATION ---
    # Patina areas should be less metallic
    metalness_mix = nodes.new(type='ShaderNodeMath')
    metalness_mix.operation = 'MULTIPLY'
    metalness_mix.location = (100, -150)

    metalness_base = nodes.new(type='ShaderNodeValue')
    metalness_base.outputs[0].default_value = variation["metalness"]
    metalness_base.location = (-100, -150)

    # Invert noise for metalness (patina = less metallic)
    invert = nodes.new(type='ShaderNodeInvert')
    invert.location = (-250, -200)
    links.new(color_ramp.outputs['Color'], invert.inputs['Color'])

    metalness_remap = nodes.new(type='ShaderNodeMapRange')
    metalness_remap.inputs['From Min'].default_value = 0.0
    metalness_remap.inputs['From Max'].default_value = 1.0
    metalness_remap.inputs['To Min'].default_value = variation["metalness"] * 0.3
    metalness_remap.inputs['To Max'].default_value = variation["metalness"]
    metalness_remap.location = (100, -200)
    links.new(invert.outputs['Color'], metalness_remap.inputs['Value'])
    links.new(metalness_remap.outputs['Result'], principled.inputs['Metallic'])

    # Set IOR
    principled.inputs['IOR'].default_value = 1.45

    return mat


def setup_render_settings():
    """Configure render settings"""
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'

    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = True
    scene.cycles.device = 'GPU'

    scene.cycles.samples = 256  # Higher samples for better noise texture detail
    scene.cycles.use_denoising = True

    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True


def render_variation(sphere, variation, output_dir):
    """Render a single aged copper variation"""
    mat = create_aged_copper_material(variation)

    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)

    output_path = output_dir / f"{variation['id']}.png"
    bpy.context.scene.render.filepath = str(output_path)

    print(f"Rendering: {variation['name']} ({variation['id']})")
    bpy.ops.render.render(write_still=True)
    print(f"  -> Saved to: {output_path}")

    return output_path


def main():
    print("\n" + "=" * 60)
    print("Copper Aged Variations Renderer (Procedural Weathering)")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nOutput directory: {OUTPUT_DIR}")

    print("\nSetting up scene...")
    sphere = setup_scene()

    print("Configuring render settings...")
    setup_render_settings()

    print(f"\nRendering {len(AGED_VARIATIONS)} aged variations...")
    print("-" * 40)

    rendered_files = []
    for i, variation in enumerate(AGED_VARIATIONS, 1):
        print(f"\n[{i}/{len(AGED_VARIATIONS)}] {variation['name']}")
        output_path = render_variation(sphere, variation, OUTPUT_DIR)
        rendered_files.append(output_path)

    print("\n" + "=" * 60)
    print("Rendering Complete!")
    print(f"Generated {len(rendered_files)} aged copper previews")
    print("=" * 60)

    return rendered_files


if __name__ == "__main__":
    main()
