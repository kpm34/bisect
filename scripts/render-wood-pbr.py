#!/usr/bin/env python3
"""
Wood PBR Materials Renderer - Uses downloaded AmbientCG textures
Renders sphere previews with full PBR maps (diffuse, normal, roughness, displacement)
"""

import bpy
import os
import math
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "wood"
PBR_DIR = BASE_DIR / "pbr"
OUTPUT_DIR = BASE_DIR

# Wood materials with their folder names
WOOD_MATERIALS = [
    {"id": "oak", "name": "Oak"},
    {"id": "walnut", "name": "Walnut"},
    {"id": "maple", "name": "Maple"},
    {"id": "cherry", "name": "Cherry"},
    {"id": "pine", "name": "Pine"},
    {"id": "mahogany", "name": "Mahogany"},
    {"id": "ebony", "name": "Ebony"},
    {"id": "birch", "name": "Birch"},
    {"id": "teak", "name": "Teak"},
    {"id": "ash", "name": "Ash"},
    {"id": "rosewood", "name": "Rosewood"},
    {"id": "bamboo", "name": "Bamboo"},
]


def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # UV Sphere for better texture mapping
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=64, ring_count=32, location=(0, 0, 0))
    sphere = bpy.context.active_object
    sphere.name = "PreviewSphere"
    bpy.ops.object.shade_smooth()

    # Camera
    bpy.ops.object.camera_add(location=(3, -3, 2.5))
    camera = bpy.context.active_object
    camera.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = camera

    # World/HDRI
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
        node_background.inputs['Strength'].default_value = 1.2
    links.new(node_background.outputs['Background'], node_output.inputs['Surface'])

    # Soft lighting for wood
    for loc, energy, size, rot in [
        ((4, -2, 4), 120, 3, (45, 0, 30)),
        ((-3, -3, 2), 50, 4, (60, 0, -45)),
        ((0, 4, 2), 100, 3, (70, 0, 180))
    ]:
        bpy.ops.object.light_add(type='AREA', location=loc)
        light = bpy.context.active_object
        light.data.energy = energy
        light.data.size = size
        light.rotation_euler = tuple(math.radians(r) for r in rot)

    return sphere


def create_pbr_material(wood_id: str, wood_name: str):
    """Create material using PBR texture maps"""
    mat = bpy.data.materials.new(name=wood_id)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    texture_dir = PBR_DIR / wood_id

    # Output
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (600, 0)

    # Principled BSDF
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    # Texture coordinate & mapping
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    tex_coord.location = (-800, 0)

    mapping = nodes.new(type='ShaderNodeMapping')
    mapping.location = (-600, 0)
    mapping.inputs['Scale'].default_value = (2.0, 2.0, 2.0)  # Tile for smaller grain
    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

    # Diffuse/Color map
    diffuse_path = texture_dir / "diffuse.jpg"
    if diffuse_path.exists():
        diffuse_tex = nodes.new(type='ShaderNodeTexImage')
        diffuse_tex.location = (-300, 300)
        diffuse_tex.image = bpy.data.images.load(str(diffuse_path))
        links.new(mapping.outputs['Vector'], diffuse_tex.inputs['Vector'])
        links.new(diffuse_tex.outputs['Color'], principled.inputs['Base Color'])

    # Normal map
    normal_path = texture_dir / "normal.jpg"
    if normal_path.exists():
        normal_tex = nodes.new(type='ShaderNodeTexImage')
        normal_tex.location = (-300, 0)
        normal_tex.image = bpy.data.images.load(str(normal_path))
        normal_tex.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], normal_tex.inputs['Vector'])

        normal_map = nodes.new(type='ShaderNodeNormalMap')
        normal_map.location = (0, 0)
        normal_map.inputs['Strength'].default_value = 1.0
        links.new(normal_tex.outputs['Color'], normal_map.inputs['Color'])
        links.new(normal_map.outputs['Normal'], principled.inputs['Normal'])

    # Roughness map
    roughness_path = texture_dir / "roughness.jpg"
    if roughness_path.exists():
        rough_tex = nodes.new(type='ShaderNodeTexImage')
        rough_tex.location = (-300, -200)
        rough_tex.image = bpy.data.images.load(str(roughness_path))
        rough_tex.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], rough_tex.inputs['Vector'])
        links.new(rough_tex.outputs['Color'], principled.inputs['Roughness'])
    else:
        # Default roughness for wood
        principled.inputs['Roughness'].default_value = 0.5

    # Displacement (subtle for sphere preview)
    disp_path = texture_dir / "displacement.jpg"
    if disp_path.exists():
        disp_tex = nodes.new(type='ShaderNodeTexImage')
        disp_tex.location = (-300, -400)
        disp_tex.image = bpy.data.images.load(str(disp_path))
        disp_tex.image.colorspace_settings.name = 'Non-Color'
        links.new(mapping.outputs['Vector'], disp_tex.inputs['Vector'])

        # Use bump instead of displacement for preview
        bump = nodes.new(type='ShaderNodeBump')
        bump.location = (0, -300)
        bump.inputs['Strength'].default_value = 0.3
        links.new(disp_tex.outputs['Color'], bump.inputs['Height'])
        # Combine with normal map
        links.new(bump.outputs['Normal'], principled.inputs['Normal'])

    # Wood properties - not metallic, slight subsurface
    principled.inputs['Metallic'].default_value = 0.0
    principled.inputs['IOR'].default_value = 1.5
    principled.inputs['Subsurface Weight'].default_value = 0.02

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
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True


def main():
    print("\n" + "=" * 50)
    print(f"Wood PBR Materials Renderer ({len(WOOD_MATERIALS)} materials)")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sphere = setup_scene()
    setup_render_settings()

    for i, wood in enumerate(WOOD_MATERIALS, 1):
        print(f"[{i}/{len(WOOD_MATERIALS)}] {wood['name']}")

        texture_dir = PBR_DIR / wood['id']
        if not texture_dir.exists():
            print(f"  SKIP: No textures found at {texture_dir}")
            continue

        mat = create_pbr_material(wood['id'], wood['name'])
        if sphere.data.materials:
            sphere.data.materials[0] = mat
        else:
            sphere.data.materials.append(mat)

        output_path = OUTPUT_DIR / f"{wood['id']}.png"
        bpy.context.scene.render.filepath = str(output_path)
        bpy.ops.render.render(write_still=True)
        print(f"  -> {wood['id']}.png")

    print("\nDone!")


if __name__ == "__main__":
    main()
