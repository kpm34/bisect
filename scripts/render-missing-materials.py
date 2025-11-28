#!/usr/bin/env python3
"""
Missing Materials Renderer

Renders the 6 missing material preview images:
1. copper-antique.png
2. copper-red.png
3. gold-rough.png
4. silver-platinum.png
5. titanium-anodized-blue.png
6. titanium-anodized-purple.png

Run with: /Users/postgres/Blender.app/Contents/MacOS/Blender --background --python render-missing-materials.py
"""

import bpy
import os
import math
from pathlib import Path

# Output directory
OUTPUT_DIR = Path("/tmp/missing-materials")

# Missing materials to render
MISSING_MATERIALS = [
    # Copper variations
    {
        "id": "copper-antique",
        "name": "Antique Copper",
        "color": (0.6, 0.35, 0.25),  # Darker, aged copper
        "roughness": 0.5,
        "metalness": 0.85,
        "output_path": "metal/copper-variations"
    },
    {
        "id": "copper-red",
        "name": "Red Copper",
        "color": (0.85, 0.35, 0.25),  # Reddish copper
        "roughness": 0.2,
        "metalness": 1.0,
        "output_path": "metal/copper-variations"
    },
    # Gold variation
    {
        "id": "gold-rough",
        "name": "Rough Cast Gold",
        "color": (1.0, 0.843, 0.0),  # Standard gold
        "roughness": 0.8,  # Very rough
        "metalness": 1.0,
        "output_path": "metal/gold-variations"
    },
    # Silver variation
    {
        "id": "silver-platinum",
        "name": "Platinum Silver",
        "color": (0.9, 0.9, 0.92),  # Slightly blue-ish platinum
        "roughness": 0.1,
        "metalness": 1.0,
        "output_path": "metal/silver-variations"
    },
    # Titanium variations
    {
        "id": "titanium-anodized-blue",
        "name": "Anodized Blue Titanium",
        "color": (0.2, 0.4, 0.8),  # Blue anodized
        "roughness": 0.25,
        "metalness": 0.95,
        "output_path": "metal/titanium-variations"
    },
    {
        "id": "titanium-anodized-purple",
        "name": "Anodized Purple Titanium",
        "color": (0.5, 0.2, 0.7),  # Purple anodized
        "roughness": 0.25,
        "metalness": 0.95,
        "output_path": "metal/titanium-variations"
    },
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
        # Fallback to gradient
        node_gradient = nodes.new(type='ShaderNodeTexGradient')
        node_colorramp = nodes.new(type='ShaderNodeValToRGB')
        node_texcoord = nodes.new(type='ShaderNodeTexCoord')

        node_gradient.gradient_type = 'SPHERICAL'
        node_colorramp.color_ramp.elements[0].color = (0.8, 0.85, 0.9, 1)
        node_colorramp.color_ramp.elements[1].color = (0.3, 0.35, 0.4, 1)

        links.new(node_texcoord.outputs['Generated'], node_gradient.inputs['Vector'])
        links.new(node_gradient.outputs['Fac'], node_colorramp.inputs['Fac'])
        links.new(node_colorramp.outputs['Color'], node_background.inputs['Color'])
        node_background.inputs['Strength'].default_value = 1.5
        print("Using gradient background")

    links.new(node_background.outputs['Background'], node_output.inputs['Surface'])

    # Add 3-point lighting
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


def create_material(variation):
    """Create a PBR metal material"""
    mat = bpy.data.materials.new(name=variation["id"])
    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    principled = nodes.get("Principled BSDF")

    if principled:
        principled.inputs["Base Color"].default_value = (*variation["color"], 1.0)
        principled.inputs["Metallic"].default_value = variation["metalness"]
        principled.inputs["Roughness"].default_value = variation["roughness"]
        principled.inputs["IOR"].default_value = 0.5

    return mat


def setup_render_settings():
    """Configure render settings for preview images"""
    scene = bpy.context.scene

    # Use Cycles for better metal rendering
    scene.render.engine = 'CYCLES'

    # Use CPU for headless rendering (more stable)
    scene.cycles.device = 'CPU'

    # Quality settings - lower samples for faster CPU render
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True

    # Output settings
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True


def render_material(sphere, variation, output_dir):
    """Render a single material variation"""
    # Create and apply material
    mat = create_material(variation)

    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)

    # Create subdirectory if needed
    subdir = output_dir / variation["output_path"]
    subdir.mkdir(parents=True, exist_ok=True)

    # Set output path
    output_path = subdir / f"{variation['id']}.png"
    bpy.context.scene.render.filepath = str(output_path)

    # Render
    print(f"Rendering: {variation['name']} ({variation['id']})")
    bpy.ops.render.render(write_still=True)

    print(f"  -> Saved to: {output_path}")

    return output_path


def main():
    """Main rendering pipeline"""
    print("\n" + "=" * 60)
    print("Missing Materials Renderer")
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

    # Render each material
    print(f"\nRendering {len(MISSING_MATERIALS)} missing materials...")
    print("-" * 40)

    rendered_files = []
    for i, variation in enumerate(MISSING_MATERIALS, 1):
        print(f"\n[{i}/{len(MISSING_MATERIALS)}] {variation['name']}")
        output_path = render_material(sphere, variation, OUTPUT_DIR)
        rendered_files.append(output_path)

    print("\n" + "=" * 60)
    print("Rendering Complete!")
    print(f"Generated {len(rendered_files)} preview images")
    print("=" * 60)

    print("\nFiles to upload to Supabase storage:")
    for f in rendered_files:
        print(f"  {f}")

    return rendered_files


if __name__ == "__main__":
    main()
