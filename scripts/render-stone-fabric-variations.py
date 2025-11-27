#!/usr/bin/env python3
"""
Stone & Fabric Variations Renderer

Renders material variations for Stone and Fabric categories using Blender.
Run with: /path/to/blender --background --python render-stone-fabric-variations.py
"""

import bpy
import os
import math
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "generated"

# Stone Variations
STONE_VARIATIONS = [
    {"id": "stone-marble-carrara", "name": "Carrara White", "color": (0.95, 0.95, 0.95), "roughness": 0.1, "metalness": 0.0, "type": "marble"},
    {"id": "stone-marble-black", "name": "Black Marquina", "color": (0.05, 0.05, 0.05), "roughness": 0.1, "metalness": 0.0, "type": "marble"},
    {"id": "stone-granite-speckled", "name": "Speckled Grey", "color": (0.6, 0.6, 0.6), "roughness": 0.4, "metalness": 0.0, "type": "granite"},
    {"id": "stone-concrete-smooth", "name": "Smooth Grey", "color": (0.5, 0.5, 0.5), "roughness": 0.8, "metalness": 0.0, "type": "concrete"},
    {"id": "stone-sandstone-beige", "name": "Desert Beige", "color": (0.82, 0.70, 0.55), "roughness": 0.9, "metalness": 0.0, "type": "sandstone"},
    {"id": "stone-slate-dark", "name": "Dark Slate", "color": (0.2, 0.2, 0.25), "roughness": 0.6, "metalness": 0.0, "type": "slate"},
]

# Fabric Variations
FABRIC_VARIATIONS = [
    {"id": "fabric-cotton-white", "name": "Basic White", "color": (0.95, 0.95, 0.95), "roughness": 0.9, "metalness": 0.0, "sheen": 0.0, "type": "cotton"},
    {"id": "fabric-silk-red", "name": "Crimson Red", "color": (0.55, 0.0, 0.0), "roughness": 0.4, "metalness": 0.0, "sheen": 1.0, "type": "silk"},
    {"id": "fabric-denim-blue", "name": "Classic Blue", "color": (0.1, 0.2, 0.4), "roughness": 0.8, "metalness": 0.0, "sheen": 0.1, "type": "denim"},
    {"id": "fabric-leather-brown", "name": "Saddle Brown", "color": (0.35, 0.15, 0.05), "roughness": 0.4, "metalness": 0.0, "sheen": 0.2, "type": "leather"},
    {"id": "fabric-velvet-purple", "name": "Royal Purple", "color": (0.25, 0.0, 0.25), "roughness": 0.7, "metalness": 0.0, "sheen": 1.0, "type": "velvet"},
]

def setup_scene():
    """Setup a clean scene with proper lighting"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=128, ring_count=64)
    sphere = bpy.context.active_object
    sphere.name = "PreviewSphere"
    bpy.ops.object.shade_smooth()
    
    # Camera
    bpy.ops.object.camera_add(location=(3, -3, 2.5))
    camera = bpy.context.active_object
    camera.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = camera
    
    # Lighting (3-point)
    bpy.ops.object.light_add(type='AREA', location=(4, -2, 4))
    key = bpy.context.active_object
    key.data.energy = 200
    
    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
    fill = bpy.context.active_object
    fill.data.energy = 80
    
    bpy.ops.object.light_add(type='AREA', location=(0, 4, 2))
    rim = bpy.context.active_object
    rim.data.energy = 150
    
    return sphere

def create_stone_material(variation):
    mat = bpy.data.materials.new(name=variation["id"])
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    principled = nodes.get("Principled BSDF")
    
    principled.inputs["Base Color"].default_value = (*variation["color"], 1.0)
    principled.inputs["Roughness"].default_value = variation["roughness"]
    principled.inputs["Metallic"].default_value = variation["metalness"]
    
    # Add procedural noise for stone texture
    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 50.0
    
    bump = nodes.new(type='ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.1
    
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], principled.inputs['Normal'])
    
    return mat

def create_fabric_material(variation):
    mat = bpy.data.materials.new(name=variation["id"])
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    principled = nodes.get("Principled BSDF")
    
    principled.inputs["Base Color"].default_value = (*variation["color"], 1.0)
    principled.inputs["Roughness"].default_value = variation["roughness"]
    principled.inputs["Metallic"].default_value = variation["metalness"]
    
    if "sheen" in variation:
        principled.inputs["Sheen Weight"].default_value = variation["sheen"]
        
    # Add procedural weave for fabric
    wave = nodes.new(type='ShaderNodeTexWave')
    wave.inputs['Scale'].default_value = 100.0
    
    bump = nodes.new(type='ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.2
    
    links.new(wave.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], principled.inputs['Normal'])
    
    return mat

def setup_render_settings():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = True

def render_variation(sphere, variation, category):
    if category == 'stone':
        mat = create_stone_material(variation)
    else:
        mat = create_fabric_material(variation)
        
    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)
        
    output_path = OUTPUT_DIR / f"{variation['id']}.png"
    bpy.context.scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    return output_path

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sphere = setup_scene()
    setup_render_settings()
    
    for var in STONE_VARIATIONS:
        render_variation(sphere, var, 'stone')
        
    for var in FABRIC_VARIATIONS:
        render_variation(sphere, var, 'fabric')

if __name__ == "__main__":
    main()
