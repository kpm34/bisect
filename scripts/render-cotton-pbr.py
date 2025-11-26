#!/usr/bin/env python3
"""
Render 10 Cotton Fabric Variations using PBR Textures
Uses real texture maps from AmbientCG with color tinting
"""

import bpy
import math
import os
from pathlib import Path

# Paths
TEXTURE_DIR = Path("/Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect/public/assets/materials/fabric/cotton")
OUTPUT_DIR = Path("/Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect/public/assets/materials/fabric/cotton-variations")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Cotton variations: name -> (tint_color_hex, color_mix_factor)
# Mix factor: 0 = original texture, 1 = full tint color
COTTON_VARIATIONS = {
    "cotton-white": ("#FFFFFF", 0.0),       # Original white cotton
    "cotton-natural": ("#F5E6D3", 0.15),    # Slight cream tint
    "cotton-gray": ("#808080", 0.6),        # Gray tinted
    "cotton-navy": ("#1E3A5F", 0.75),       # Navy blue
    "cotton-black": ("#1A1A1A", 0.85),      # Black
    "cotton-beige": ("#D4B896", 0.4),       # Beige/tan
    "cotton-olive": ("#6B7B5E", 0.65),      # Olive green
    "cotton-burgundy": ("#722F37", 0.7),    # Burgundy/wine
    "cotton-charcoal": ("#36454F", 0.75),   # Charcoal
    "cotton-sky": ("#87CEEB", 0.5),         # Sky blue
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple (0-1 range)"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b, 1.0)

def create_cotton_pbr_material(name, tint_hex, mix_factor):
    """Create a PBR cotton fabric material with color tinting"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Output node
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (1200, 0)

    # Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (800, 0)

    # Texture coordinate
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)

    # Mapping node for texture control
    mapping = nodes.new('ShaderNodeMapping')
    mapping.location = (-600, 0)
    mapping.inputs['Scale'].default_value = (2.0, 2.0, 2.0)

    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

    # === DIFFUSE/COLOR ===
    diffuse_tex = nodes.new('ShaderNodeTexImage')
    diffuse_tex.location = (-400, 300)
    diffuse_tex.image = bpy.data.images.load(str(TEXTURE_DIR / "diffuse.jpg"))
    diffuse_tex.image.colorspace_settings.name = 'sRGB'
    links.new(mapping.outputs['Vector'], diffuse_tex.inputs['Vector'])

    # Color tinting - mix original with tint color
    tint_color = nodes.new('ShaderNodeRGB')
    tint_color.location = (-200, 400)
    tint_color.outputs[0].default_value = hex_to_rgb(tint_hex)

    # Mix RGB for color tinting (multiply blend preserves texture detail)
    color_mix = nodes.new('ShaderNodeMixRGB')
    color_mix.location = (0, 300)
    color_mix.blend_type = 'MULTIPLY'
    color_mix.inputs['Fac'].default_value = mix_factor
    links.new(diffuse_tex.outputs['Color'], color_mix.inputs['Color1'])
    links.new(tint_color.outputs['Color'], color_mix.inputs['Color2'])

    # For darker colors, use overlay blend instead
    if mix_factor > 0.5:
        color_mix.blend_type = 'OVERLAY'

    # Brightness/contrast adjustment for colored variants
    if mix_factor > 0:
        bc_node = nodes.new('ShaderNodeBrightContrast')
        bc_node.location = (200, 300)
        bc_node.inputs['Bright'].default_value = -0.1 * mix_factor
        bc_node.inputs['Contrast'].default_value = 0.1
        links.new(color_mix.outputs['Color'], bc_node.inputs['Color'])
        links.new(bc_node.outputs['Color'], principled.inputs['Base Color'])
    else:
        links.new(color_mix.outputs['Color'], principled.inputs['Base Color'])

    # === ROUGHNESS ===
    roughness_tex = nodes.new('ShaderNodeTexImage')
    roughness_tex.location = (-400, 0)
    roughness_tex.image = bpy.data.images.load(str(TEXTURE_DIR / "roughness.jpg"))
    roughness_tex.image.colorspace_settings.name = 'Non-Color'
    links.new(mapping.outputs['Vector'], roughness_tex.inputs['Vector'])
    links.new(roughness_tex.outputs['Color'], principled.inputs['Roughness'])

    # === NORMAL MAP ===
    normal_tex = nodes.new('ShaderNodeTexImage')
    normal_tex.location = (-400, -300)
    normal_tex.image = bpy.data.images.load(str(TEXTURE_DIR / "normal.jpg"))
    normal_tex.image.colorspace_settings.name = 'Non-Color'
    links.new(mapping.outputs['Vector'], normal_tex.inputs['Vector'])

    normal_map = nodes.new('ShaderNodeNormalMap')
    normal_map.location = (0, -300)
    normal_map.inputs['Strength'].default_value = 1.0
    links.new(normal_tex.outputs['Color'], normal_map.inputs['Color'])
    links.new(normal_map.outputs['Normal'], principled.inputs['Normal'])

    # === AO (multiply with diffuse) ===
    ao_tex = nodes.new('ShaderNodeTexImage')
    ao_tex.location = (-400, 600)
    ao_tex.image = bpy.data.images.load(str(TEXTURE_DIR / "ao.jpg"))
    ao_tex.image.colorspace_settings.name = 'Non-Color'
    links.new(mapping.outputs['Vector'], ao_tex.inputs['Vector'])

    # === DISPLACEMENT (optional, for bump detail) ===
    disp_tex = nodes.new('ShaderNodeTexImage')
    disp_tex.location = (-400, -600)
    disp_tex.image = bpy.data.images.load(str(TEXTURE_DIR / "displacement.jpg"))
    disp_tex.image.colorspace_settings.name = 'Non-Color'
    links.new(mapping.outputs['Vector'], disp_tex.inputs['Vector'])

    # Bump node for micro detail
    bump = nodes.new('ShaderNodeBump')
    bump.location = (400, -400)
    bump.inputs['Strength'].default_value = 0.05
    links.new(disp_tex.outputs['Color'], bump.inputs['Height'])
    links.new(normal_map.outputs['Normal'], bump.inputs['Normal'])
    links.new(bump.outputs['Normal'], principled.inputs['Normal'])

    # === FABRIC PROPERTIES ===
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['Specular IOR Level'].default_value = 0.3

    # Sheen for fabric softness
    principled.inputs['Sheen Weight'].default_value = 0.4
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

    # Setup world/environment
    world = bpy.context.scene.world
    if not world:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    world_nodes = world.node_tree.nodes
    world_links = world.node_tree.links
    world_nodes.clear()

    # Gradient background for studio look
    bg = world_nodes.new('ShaderNodeBackground')
    bg.location = (0, 0)
    bg.inputs['Color'].default_value = (0.15, 0.15, 0.18, 1.0)
    bg.inputs['Strength'].default_value = 0.5

    output = world_nodes.new('ShaderNodeOutputWorld')
    output.location = (200, 0)
    world_links.new(bg.outputs['Background'], output.inputs['Surface'])

    # Key light (main light)
    bpy.ops.object.light_add(type='AREA', location=(3, -2, 4))
    key_light = bpy.context.active_object
    key_light.name = "KeyLight"
    key_light.data.energy = 200
    key_light.data.size = 3
    key_light.data.color = (1.0, 0.98, 0.95)

    # Fill light
    bpy.ops.object.light_add(type='AREA', location=(-3, -1, 2))
    fill_light = bpy.context.active_object
    fill_light.name = "FillLight"
    fill_light.data.energy = 80
    fill_light.data.size = 2.5

    # Rim light
    bpy.ops.object.light_add(type='AREA', location=(0, 3, 2))
    rim_light = bpy.context.active_object
    rim_light.name = "RimLight"
    rim_light.data.energy = 100
    rim_light.data.size = 2

    return sphere

def setup_render_settings():
    """Configure render settings for preview images"""
    scene = bpy.context.scene

    # Render engine
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'
    scene.cycles.samples = 256  # Higher samples for fabric detail
    scene.cycles.use_denoising = True

    # Output settings
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    # Film settings
    scene.render.film_transparent = True

def render_variation(sphere, name, tint_hex, mix_factor):
    """Render a single cotton variation"""
    print(f"  Rendering {name}...")

    # Create material
    mat = create_cotton_pbr_material(name, tint_hex, mix_factor)

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
    print("Rendering Cotton PBR Variations")
    print("=" * 60)

    # Setup scene
    print("\nSetting up scene...")
    sphere = setup_scene()
    setup_render_settings()

    # Render each variation
    print("\nRendering variations with PBR textures:")
    rendered = []

    for name, (tint_hex, mix_factor) in COTTON_VARIATIONS.items():
        path = render_variation(sphere, name, tint_hex, mix_factor)
        rendered.append(path)

    print(f"\n✓ Rendered {len(rendered)} cotton PBR variations")
    print(f"Output directory: {OUTPUT_DIR}")

    # Create preview HTML
    html_path = OUTPUT_DIR / "preview.html"
    with open(html_path, 'w') as f:
        f.write('''<!DOCTYPE html>
<html><head><title>Cotton PBR Variations Preview</title>
<style>
body { font-family: system-ui; background: #1a1a1a; color: #fff; padding: 40px; }
h1 { text-align: center; margin-bottom: 10px; }
h2 { text-align: center; color: #888; font-size: 14px; margin-bottom: 40px; }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; max-width: 1200px; margin: 0 auto; }
.card { background: #2a2a2a; border-radius: 12px; overflow: hidden; transition: transform 0.2s; }
.card:hover { transform: scale(1.05); }
.card img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #111; }
.label { padding: 12px; text-align: center; font-size: 14px; font-weight: 500; }
</style></head><body>
<h1>Cotton Fabric Variations (10)</h1>
<h2>PBR Textures from AmbientCG with Color Tinting</h2>
<div class="grid">
''')
        for name in COTTON_VARIATIONS.keys():
            display_name = name.replace('cotton-', '').replace('-', ' ').title()
            f.write(f'<div class="card"><img src="{name}.png"><div class="label">{display_name}</div></div>\n')
        f.write('</div></body></html>')

    print(f"Preview: {html_path}")

if __name__ == "__main__":
    main()
