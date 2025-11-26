#!/usr/bin/env python3
"""
Copper Variations Renderer

Renders multiple copper material variations as sphere previews using Blender.
Run with: /path/to/blender --background --python render-copper-variations.py

Output: Creates 512x512 PNG images for each copper variation
"""

import bpy
import os
import math
from pathlib import Path

# Output directory (relative to this script or absolute)
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "copper-variations"

# Copper variations to render
COPPER_VARIATIONS = [
    # Standard Finishes
    {"id": "copper-mirror", "name": "Mirror Copper", "color": (0.95, 0.64, 0.54), "roughness": 0.0, "metalness": 1.0},
    {"id": "copper-polished", "name": "Polished Copper", "color": (0.93, 0.60, 0.50), "roughness": 0.1, "metalness": 1.0},
    {"id": "copper-satin", "name": "Satin Copper", "color": (0.88, 0.55, 0.45), "roughness": 0.3, "metalness": 1.0},
    {"id": "copper-brushed", "name": "Brushed Copper", "color": (0.85, 0.52, 0.42), "roughness": 0.45, "metalness": 1.0},
    {"id": "copper-matte", "name": "Matte Copper", "color": (0.80, 0.48, 0.38), "roughness": 0.6, "metalness": 1.0},

    # Copper Tints
    {"id": "copper-rose", "name": "Rose Copper", "color": (0.90, 0.58, 0.55), "roughness": 0.15, "metalness": 1.0},
    {"id": "copper-penny", "name": "Penny", "color": (0.72, 0.45, 0.32), "roughness": 0.2, "metalness": 1.0},
    {"id": "copper-bronze", "name": "Bronze", "color": (0.80, 0.50, 0.28), "roughness": 0.25, "metalness": 1.0},
    {"id": "copper-red", "name": "Red Copper", "color": (0.85, 0.42, 0.35), "roughness": 0.15, "metalness": 1.0},
    {"id": "copper-warm", "name": "Warm Copper", "color": (0.92, 0.58, 0.42), "roughness": 0.12, "metalness": 1.0},

    # Aged & Special
    {"id": "copper-oxidized", "name": "Oxidized", "color": (0.55, 0.40, 0.32), "roughness": 0.5, "metalness": 0.7},
    {"id": "copper-patina", "name": "Green Patina", "color": (0.35, 0.55, 0.48), "roughness": 0.6, "metalness": 0.4},
    {"id": "copper-verdigris", "name": "Verdigris", "color": (0.28, 0.52, 0.45), "roughness": 0.55, "metalness": 0.5},
    {"id": "copper-weathered", "name": "Weathered", "color": (0.60, 0.45, 0.35), "roughness": 0.5, "metalness": 0.75},
    {"id": "copper-antique", "name": "Antique Copper", "color": (0.50, 0.35, 0.28), "roughness": 0.45, "metalness": 0.8},
]


def setup_scene():
    """Setup a clean scene with proper lighting for material preview"""
    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Create sphere
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0,
        segments=128,
        ring_count=64,
        location=(0, 0, 0)
    )
    sphere = bpy.context.active_object
    sphere.name = "PreviewSphere"

    # Smooth shading
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

    # Create HDRI-like environment with gradient
    nodes = world.node_tree.nodes
    links = world.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Add nodes for studio-like lighting
    node_background = nodes.new(type='ShaderNodeBackground')
    node_environment = nodes.new(type='ShaderNodeTexEnvironment')
    node_output = nodes.new(type='ShaderNodeOutputWorld')
    node_gradient = nodes.new(type='ShaderNodeTexGradient')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    node_texcoord = nodes.new(type='ShaderNodeTexCoord')
    node_colorramp = nodes.new(type='ShaderNodeValToRGB')

    # Setup gradient for studio lighting effect
    node_gradient.gradient_type = 'SPHERICAL'

    # Configure color ramp for studio lighting
    node_colorramp.color_ramp.elements[0].color = (0.8, 0.85, 0.9, 1)  # Light blue/white
    node_colorramp.color_ramp.elements[1].color = (0.3, 0.35, 0.4, 1)  # Darker gradient

    # Link nodes
    links.new(node_texcoord.outputs['Generated'], node_mapping.inputs['Vector'])
    links.new(node_mapping.outputs['Vector'], node_gradient.inputs['Vector'])
    links.new(node_gradient.outputs['Fac'], node_colorramp.inputs['Fac'])
    links.new(node_colorramp.outputs['Color'], node_background.inputs['Color'])
    node_background.inputs['Strength'].default_value = 1.5
    links.new(node_background.outputs['Background'], node_output.inputs['Surface'])

    # Alternative: Use built-in HDRI if available
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

    if hdri_path:
        # Use actual HDRI
        nodes.clear()
        node_background = nodes.new(type='ShaderNodeBackground')
        node_environment = nodes.new(type='ShaderNodeTexEnvironment')
        node_output = nodes.new(type='ShaderNodeOutputWorld')

        node_environment.image = bpy.data.images.load(hdri_path)
        links.new(node_environment.outputs['Color'], node_background.inputs['Color'])
        node_background.inputs['Strength'].default_value = 1.0
        links.new(node_background.outputs['Background'], node_output.inputs['Surface'])
        print(f"Using HDRI: {hdri_path}")
    else:
        print("No HDRI found, using gradient background")

    # Add 3-point lighting for better preview
    # Key light
    bpy.ops.object.light_add(type='AREA', location=(4, -2, 4))
    key_light = bpy.context.active_object
    key_light.name = "KeyLight"
    key_light.data.energy = 200
    key_light.data.size = 2
    key_light.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
    fill_light = bpy.context.active_object
    fill_light.name = "FillLight"
    fill_light.data.energy = 80
    fill_light.data.size = 3
    fill_light.rotation_euler = (math.radians(60), 0, math.radians(-45))

    # Rim light
    bpy.ops.object.light_add(type='AREA', location=(0, 4, 2))
    rim_light = bpy.context.active_object
    rim_light.name = "RimLight"
    rim_light.data.energy = 150
    rim_light.data.size = 2
    rim_light.rotation_euler = (math.radians(70), 0, math.radians(180))

    return sphere


def create_copper_material(variation):
    """Create a PBR copper material"""
    mat = bpy.data.materials.new(name=variation["id"])
    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Get principled BSDF
    principled = nodes.get("Principled BSDF")

    if principled:
        # Set base color
        principled.inputs["Base Color"].default_value = (*variation["color"], 1.0)

        # Set metallic
        principled.inputs["Metallic"].default_value = variation["metalness"]

        # Set roughness
        principled.inputs["Roughness"].default_value = variation["roughness"]

        # Set IOR for metals
        principled.inputs["IOR"].default_value = 0.5  # Metals have low IOR

        # Specular for metals
        if "Specular IOR Level" in principled.inputs:
            principled.inputs["Specular IOR Level"].default_value = 0.5

    return mat


def setup_render_settings():
    """Configure render settings for preview images"""
    scene = bpy.context.scene

    # Use Cycles for better metal rendering
    scene.render.engine = 'CYCLES'

    # GPU if available
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'  # macOS
    prefs.get_devices()

    for device in prefs.devices:
        device.use = True

    scene.cycles.device = 'GPU'

    # Quality settings
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True

    # Output settings
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True


def render_variation(sphere, variation, output_dir):
    """Render a single copper variation"""
    # Create and apply material
    mat = create_copper_material(variation)

    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)

    # Set output path
    output_path = output_dir / f"{variation['id']}.png"
    bpy.context.scene.render.filepath = str(output_path)

    # Render
    print(f"Rendering: {variation['name']} ({variation['id']})")
    bpy.ops.render.render(write_still=True)

    print(f"  -> Saved to: {output_path}")

    return output_path


def main():
    """Main rendering pipeline"""
    print("\n" + "=" * 60)
    print("Copper Variations Renderer")
    print("=" * 60)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nOutput directory: {OUTPUT_DIR}")

    # Setup scene
    print("\nSetting up scene...")
    sphere = setup_scene()

    # Setup render settings
    print("Configuring render settings...")
    setup_render_settings()

    # Render each variation
    print(f"\nRendering {len(COPPER_VARIATIONS)} variations...")
    print("-" * 40)

    rendered_files = []
    for i, variation in enumerate(COPPER_VARIATIONS, 1):
        print(f"\n[{i}/{len(COPPER_VARIATIONS)}] {variation['name']}")
        output_path = render_variation(sphere, variation, OUTPUT_DIR)
        rendered_files.append(output_path)

    print("\n" + "=" * 60)
    print("Rendering Complete!")
    print(f"Generated {len(rendered_files)} preview images")
    print("=" * 60)

    return rendered_files


if __name__ == "__main__":
    main()
