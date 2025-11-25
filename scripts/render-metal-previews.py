"""
Headless Blender script to render metal material sphere previews.

Run with:
/Users/postgres/Blender.app/Contents/MacOS/Blender --background --python render-metal-previews.py
"""

import bpy
import os
import math

# Output directory
OUTPUT_DIR = "/Users/kashyapmaheshwari/Blender-Workspace/projects/Bisect/public/assets/materials/metal"

# Metal material definitions with PBR properties
METAL_MATERIALS = {
    "chrome-mirror": {
        "name": "Chrome Mirror",
        "color": (0.9, 0.9, 0.9),  # RGB normalized
        "metallic": 1.0,
        "roughness": 0.05,
    },
    "gold-polished": {
        "name": "Gold Polished",
        "color": (1.0, 0.766, 0.336),  # Gold color
        "metallic": 1.0,
        "roughness": 0.1,
    },
    "brass-aged": {
        "name": "Brass Aged",
        "color": (0.78, 0.57, 0.11),  # Aged brass
        "metallic": 1.0,
        "roughness": 0.35,
    },
    "copper-clean": {
        "name": "Copper Clean",
        "color": (0.955, 0.637, 0.538),  # Copper
        "metallic": 1.0,
        "roughness": 0.15,
    },
    "aluminum-brushed": {
        "name": "Aluminum Brushed",
        "color": (0.913, 0.921, 0.925),  # Aluminum
        "metallic": 1.0,
        "roughness": 0.4,
    },
    "steel-industrial": {
        "name": "Steel Industrial",
        "color": (0.55, 0.55, 0.55),  # Dark steel
        "metallic": 1.0,
        "roughness": 0.5,
    },
    "titanium-anodized": {
        "name": "Titanium Anodized",
        "color": (0.4, 0.45, 0.65),  # Blue-ish titanium
        "metallic": 1.0,
        "roughness": 0.25,
    },
    "iron-rusty": {
        "name": "Iron Rusty",
        "color": (0.45, 0.25, 0.15),  # Rust color
        "metallic": 0.85,
        "roughness": 0.7,
    },
}

def setup_scene():
    """Clear scene and set up for material preview rendering."""
    # Delete all objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Delete all materials
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat)

    # Create UV sphere for material preview
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 0), segments=64, ring_count=32)
    sphere = bpy.context.active_object
    sphere.name = "MaterialPreviewSphere"

    # Smooth shading
    bpy.ops.object.shade_smooth()

    return sphere

def setup_lighting():
    """Set up studio lighting for material preview."""
    # Key light (main light)
    bpy.ops.object.light_add(type='AREA', location=(3, -3, 4))
    key_light = bpy.context.active_object
    key_light.name = "KeyLight"
    key_light.data.energy = 200
    key_light.data.size = 3
    key_light.data.color = (1.0, 0.98, 0.95)  # Slightly warm

    # Fill light (softer, from side)
    bpy.ops.object.light_add(type='AREA', location=(-3, 2, 2))
    fill_light = bpy.context.active_object
    fill_light.name = "FillLight"
    fill_light.data.energy = 80
    fill_light.data.size = 4
    fill_light.data.color = (0.9, 0.95, 1.0)  # Slightly cool

    # Rim light (back light for edge definition)
    bpy.ops.object.light_add(type='AREA', location=(0, 4, 1))
    rim_light = bpy.context.active_object
    rim_light.name = "RimLight"
    rim_light.data.energy = 120
    rim_light.data.size = 2
    rim_light.data.color = (1.0, 1.0, 1.0)

def setup_camera():
    """Set up camera for material preview."""
    bpy.ops.object.camera_add(location=(3.5, -3.5, 2.5))
    camera = bpy.context.active_object
    camera.name = "PreviewCamera"

    # Point camera at sphere
    camera.rotation_euler = (math.radians(65), 0, math.radians(45))

    # Set as active camera
    bpy.context.scene.camera = camera

    return camera

def setup_world():
    """Set up world/environment for reflections."""
    world = bpy.data.worlds.get("World")
    if not world:
        world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world

    world.use_nodes = True
    nodes = world.node_tree.nodes

    # Clear existing nodes
    nodes.clear()

    # Add gradient background for nice reflections
    bg_node = nodes.new('ShaderNodeBackground')
    bg_node.inputs['Color'].default_value = (0.05, 0.05, 0.08, 1.0)  # Dark blue-gray
    bg_node.inputs['Strength'].default_value = 0.5

    output_node = nodes.new('ShaderNodeOutputWorld')

    # Connect
    world.node_tree.links.new(bg_node.outputs['Background'], output_node.inputs['Surface'])

def setup_render_settings():
    """Configure render settings for preview images."""
    scene = bpy.context.scene

    # Render engine - use Cycles for realistic metals
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'GPU'  # Use GPU if available
    scene.cycles.samples = 128  # Good quality without being too slow
    scene.cycles.use_denoising = True

    # Resolution - square preview
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.resolution_percentage = 100

    # Output settings
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = True  # Transparent background

def create_metal_material(material_id, props):
    """Create a metal material with given properties."""
    mat = bpy.data.materials.new(name=props["name"])
    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Get principled BSDF
    principled = nodes.get("Principled BSDF")
    if not principled:
        principled = nodes.new('ShaderNodeBsdfPrincipled')

    # Set metal properties
    principled.inputs['Base Color'].default_value = (*props["color"], 1.0)
    principled.inputs['Metallic'].default_value = props["metallic"]
    principled.inputs['Roughness'].default_value = props["roughness"]

    # For better metal look
    principled.inputs['Specular IOR Level'].default_value = 0.5

    return mat

def render_material(sphere, material_id, props, output_dir):
    """Apply material and render preview."""
    # Create material
    mat = create_metal_material(material_id, props)

    # Assign to sphere
    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)

    # Set output path
    output_path = os.path.join(output_dir, f"{material_id}.png")
    bpy.context.scene.render.filepath = output_path

    # Render
    print(f"Rendering {props['name']}...")
    bpy.ops.render.render(write_still=True)
    print(f"  Saved to: {output_path}")

    # Clean up material
    bpy.data.materials.remove(mat)

def main():
    """Main function to render all metal material previews."""
    print("\n" + "="*60)
    print("Metal Material Preview Renderer")
    print("="*60 + "\n")

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Setup scene
    print("Setting up scene...")
    sphere = setup_scene()
    setup_lighting()
    setup_camera()
    setup_world()
    setup_render_settings()

    print(f"\nRendering {len(METAL_MATERIALS)} metal materials...\n")

    # Render each material
    for material_id, props in METAL_MATERIALS.items():
        render_material(sphere, material_id, props, OUTPUT_DIR)

    print("\n" + "="*60)
    print(f"Complete! {len(METAL_MATERIALS)} previews saved to:")
    print(f"  {OUTPUT_DIR}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
