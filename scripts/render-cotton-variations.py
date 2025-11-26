#!/usr/bin/env python3
"""
Render 10 Cotton Fabric Variations in Blender (Headless)
Creates procedural cotton shader with different colors
"""

import bpy
import math
import os
from pathlib import Path

# Output directory
OUTPUT_DIR = Path("/Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect/public/assets/materials/fabric/cotton-variations")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Cotton variations: name -> (hex_color, roughness)
COTTON_VARIATIONS = {
    "cotton-white": ("#F5F5F5", 0.85),
    "cotton-natural": ("#F5F0E6", 0.82),
    "cotton-gray": ("#A8A8A8", 0.80),
    "cotton-navy": ("#1E3A5F", 0.78),
    "cotton-black": ("#2A2A2A", 0.75),
    "cotton-beige": ("#D4C4A8", 0.82),
    "cotton-olive": ("#6B7B5E", 0.80),
    "cotton-burgundy": ("#722F37", 0.78),
    "cotton-charcoal": ("#36454F", 0.77),
    "cotton-sky": ("#87CEEB", 0.83),
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple (0-1 range)"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b, 1.0)

def create_cotton_material(name, color_hex, roughness):
    """Create a procedural cotton fabric material"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Create nodes
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (800, 0)

    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (400, 0)

    # Base color with slight variation for fabric texture
    color_rgb = hex_to_rgb(color_hex)

    # Noise texture for fabric weave variation
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 200)
    noise.inputs['Scale'].default_value = 150.0
    noise.inputs['Detail'].default_value = 8.0
    noise.inputs['Roughness'].default_value = 0.6

    # Color ramp for subtle variation
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-100, 200)
    ramp.color_ramp.elements[0].position = 0.4
    ramp.color_ramp.elements[0].color = (color_rgb[0] * 0.92, color_rgb[1] * 0.92, color_rgb[2] * 0.92, 1.0)
    ramp.color_ramp.elements[1].position = 0.6
    ramp.color_ramp.elements[1].color = color_rgb

    # Mix with base color
    mix_color = nodes.new('ShaderNodeMixRGB')
    mix_color.location = (100, 100)
    mix_color.blend_type = 'MULTIPLY'
    mix_color.inputs['Fac'].default_value = 0.15
    mix_color.inputs['Color2'].default_value = color_rgb

    # Bump for fabric texture
    bump = nodes.new('ShaderNodeBump')
    bump.location = (200, -200)
    bump.inputs['Strength'].default_value = 0.08

    # Voronoi for weave pattern
    voronoi = nodes.new('ShaderNodeTexVoronoi')
    voronoi.location = (-400, -200)
    voronoi.feature = 'F1'
    voronoi.inputs['Scale'].default_value = 200.0

    # Texture coordinate
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-600, 0)

    # Connect nodes
    links.new(tex_coord.outputs['UV'], noise.inputs['Vector'])
    links.new(tex_coord.outputs['UV'], voronoi.inputs['Vector'])
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], mix_color.inputs['Color1'])
    links.new(mix_color.outputs['Color'], principled.inputs['Base Color'])
    links.new(voronoi.outputs['Distance'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], principled.inputs['Normal'])

    # Set material properties - fabric characteristics
    principled.inputs['Roughness'].default_value = roughness
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['Specular IOR Level'].default_value = 0.3

    # Sheen for fabric softness
    principled.inputs['Sheen Weight'].default_value = 0.3
    principled.inputs['Sheen Roughness'].default_value = 0.5

    # Connect to output
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    return mat

def setup_scene():
    """Setup scene with sphere and lighting for material preview"""
    # Clear existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Create UV sphere for preview
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 0), segments=64, ring_count=32)
    sphere = bpy.context.active_object
    sphere.name = "PreviewSphere"

    # Smooth shading
    bpy.ops.object.shade_smooth()

    # Add subdivision for smoother surface
    subsurf = sphere.modifiers.new(name="Subdivision", type='SUBSURF')
    subsurf.levels = 2
    subsurf.render_levels = 2

    # Create camera
    bpy.ops.object.camera_add(location=(2.5, -2.5, 1.8))
    camera = bpy.context.active_object
    camera.name = "PreviewCamera"

    # Point camera at sphere
    direction = sphere.location - camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()

    bpy.context.scene.camera = camera

    # Add HDRI lighting
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    world_nodes = world.node_tree.nodes
    world_links = world.node_tree.links
    world_nodes.clear()

    # Background node
    bg = world_nodes.new('ShaderNodeBackground')
    bg.location = (0, 0)
    bg.inputs['Color'].default_value = (0.8, 0.85, 0.9, 1.0)
    bg.inputs['Strength'].default_value = 1.0

    # Output
    output = world_nodes.new('ShaderNodeOutputWorld')
    output.location = (200, 0)
    world_links.new(bg.outputs['Background'], output.inputs['Surface'])

    # Add key light
    bpy.ops.object.light_add(type='AREA', location=(3, -2, 4))
    key_light = bpy.context.active_object
    key_light.name = "KeyLight"
    key_light.data.energy = 150
    key_light.data.size = 3
    key_light.data.color = (1.0, 0.98, 0.95)

    # Add fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, -1, 2))
    fill_light = bpy.context.active_object
    fill_light.name = "FillLight"
    fill_light.data.energy = 50
    fill_light.data.size = 2

    # Add rim light
    bpy.ops.object.light_add(type='AREA', location=(0, 3, 2))
    rim_light = bpy.context.active_object
    rim_light.name = "RimLight"
    rim_light.data.energy = 80
    rim_light.data.size = 2

    return sphere

def setup_render_settings():
    """Configure render settings for preview images"""
    scene = bpy.context.scene

    # Render engine
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True

    # Output settings
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    # Film settings
    scene.render.film_transparent = True

def render_variation(sphere, name, color_hex, roughness):
    """Render a single cotton variation"""
    print(f"  Rendering {name}...")

    # Create material
    mat = create_cotton_material(name, color_hex, roughness)

    # Assign to sphere
    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)

    # Set output path
    output_path = str(OUTPUT_DIR / f"{name}.png")
    bpy.context.scene.render.filepath = output_path

    # Render
    bpy.ops.render.render(write_still=True)

    print(f"  ✓ Saved {name}.png")

    return output_path

def main():
    print("\n" + "=" * 60)
    print("Rendering Cotton Fabric Variations")
    print("=" * 60)

    # Setup scene
    print("\nSetting up scene...")
    sphere = setup_scene()
    setup_render_settings()

    # Render each variation
    print("\nRendering variations:")
    rendered = []

    for name, (color_hex, roughness) in COTTON_VARIATIONS.items():
        path = render_variation(sphere, name, color_hex, roughness)
        rendered.append(path)

    print(f"\n✓ Rendered {len(rendered)} cotton variations")
    print(f"Output directory: {OUTPUT_DIR}")

    # Create preview HTML
    html_path = OUTPUT_DIR / "preview.html"
    with open(html_path, 'w') as f:
        f.write('''<!DOCTYPE html>
<html><head><title>Cotton Variations Preview</title>
<style>
body { font-family: system-ui; background: #1a1a1a; color: #fff; padding: 40px; }
h1 { text-align: center; }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; max-width: 1200px; margin: 0 auto; }
.card { background: #2a2a2a; border-radius: 12px; overflow: hidden; }
.card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.label { padding: 12px; text-align: center; font-size: 14px; }
</style></head><body>
<h1>Cotton Fabric Variations (10)</h1>
<div class="grid">
''')
        for name in COTTON_VARIATIONS.keys():
            display_name = name.replace('cotton-', '').replace('-', ' ').title()
            f.write(f'<div class="card"><img src="{name}.png"><div class="label">{display_name}</div></div>\n')
        f.write('</div></body></html>')

    print(f"Preview: {html_path}")

if __name__ == "__main__":
    main()
