"""
Render Metal Material Variations for Preview Selection
Generates 10 variations each for Gold, Silver, Titanium, Iron, Copper
Each variation has different roughness/color tints for comparison
"""

import bpy
import math
import os
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "metal" / "variations"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Metal variations - 10 versions each with different properties
METAL_VARIATIONS = {
    "gold": [
        # (name, color_rgb, metallic, roughness, description)
        ("gold-v1-mirror", (1.0, 0.843, 0.0), 1.0, 0.02, "Pure mirror gold"),
        ("gold-v2-polished", (1.0, 0.766, 0.336), 1.0, 0.08, "Polished gold"),
        ("gold-v3-satin", (0.98, 0.78, 0.35), 1.0, 0.15, "Satin gold"),
        ("gold-v4-brushed", (0.95, 0.75, 0.32), 1.0, 0.25, "Brushed gold"),
        ("gold-v5-rose", (0.98, 0.68, 0.45), 1.0, 0.12, "Rose gold"),
        ("gold-v6-white", (0.95, 0.90, 0.75), 1.0, 0.10, "White gold"),
        ("gold-v7-antique", (0.85, 0.65, 0.25), 1.0, 0.35, "Antique gold"),
        ("gold-v8-champagne", (0.98, 0.85, 0.55), 1.0, 0.18, "Champagne gold"),
        ("gold-v9-matte", (0.90, 0.72, 0.30), 1.0, 0.45, "Matte gold"),
        ("gold-v10-worn", (0.82, 0.60, 0.22), 0.92, 0.40, "Worn gold"),
    ],
    "silver": [
        ("silver-v1-mirror", (0.97, 0.97, 0.97), 1.0, 0.02, "Mirror silver"),
        ("silver-v2-polished", (0.95, 0.95, 0.95), 1.0, 0.06, "Polished silver"),
        ("silver-v3-sterling", (0.92, 0.92, 0.92), 1.0, 0.12, "Sterling silver"),
        ("silver-v4-brushed", (0.88, 0.89, 0.90), 1.0, 0.28, "Brushed silver"),
        ("silver-v5-satin", (0.90, 0.90, 0.91), 1.0, 0.18, "Satin silver"),
        ("silver-v6-oxidized", (0.70, 0.72, 0.75), 0.95, 0.35, "Oxidized silver"),
        ("silver-v7-warm", (0.94, 0.92, 0.88), 1.0, 0.10, "Warm silver"),
        ("silver-v8-cool", (0.90, 0.92, 0.96), 1.0, 0.10, "Cool silver"),
        ("silver-v9-matte", (0.85, 0.85, 0.87), 1.0, 0.42, "Matte silver"),
        ("silver-v10-aged", (0.78, 0.78, 0.80), 0.92, 0.38, "Aged silver"),
    ],
    "titanium": [
        ("titanium-v1-natural", (0.62, 0.62, 0.62), 1.0, 0.25, "Natural titanium"),
        ("titanium-v2-polished", (0.75, 0.75, 0.78), 1.0, 0.12, "Polished titanium"),
        ("titanium-v3-anodized-blue", (0.35, 0.45, 0.70), 1.0, 0.22, "Anodized blue"),
        ("titanium-v4-anodized-purple", (0.55, 0.38, 0.65), 1.0, 0.22, "Anodized purple"),
        ("titanium-v5-anodized-gold", (0.75, 0.65, 0.35), 1.0, 0.22, "Anodized gold"),
        ("titanium-v6-anodized-green", (0.35, 0.55, 0.45), 1.0, 0.22, "Anodized green"),
        ("titanium-v7-brushed", (0.58, 0.58, 0.60), 1.0, 0.35, "Brushed titanium"),
        ("titanium-v8-matte", (0.55, 0.55, 0.57), 1.0, 0.50, "Matte titanium"),
        ("titanium-v9-dark", (0.42, 0.42, 0.45), 1.0, 0.30, "Dark titanium"),
        ("titanium-v10-rainbow", (0.50, 0.45, 0.55), 1.0, 0.20, "Rainbow titanium"),
    ],
    "iron": [
        ("iron-v1-polished", (0.56, 0.57, 0.58), 1.0, 0.15, "Polished iron"),
        ("iron-v2-brushed", (0.52, 0.53, 0.54), 1.0, 0.35, "Brushed iron"),
        ("iron-v3-cast", (0.35, 0.35, 0.38), 0.95, 0.55, "Cast iron"),
        ("iron-v4-wrought", (0.28, 0.28, 0.30), 0.90, 0.60, "Wrought iron"),
        ("iron-v5-rusty-light", (0.55, 0.35, 0.22), 0.75, 0.65, "Light rust"),
        ("iron-v6-rusty-heavy", (0.45, 0.25, 0.15), 0.65, 0.75, "Heavy rust"),
        ("iron-v7-patina", (0.38, 0.32, 0.28), 0.85, 0.50, "Iron patina"),
        ("iron-v8-blackened", (0.18, 0.18, 0.20), 0.95, 0.45, "Blackened iron"),
        ("iron-v9-galvanized", (0.65, 0.67, 0.70), 1.0, 0.28, "Galvanized iron"),
        ("iron-v10-weathered", (0.42, 0.38, 0.35), 0.80, 0.58, "Weathered iron"),
    ],
    "copper": [
        ("copper-v1-mirror", (0.98, 0.65, 0.55), 1.0, 0.04, "Mirror copper"),
        ("copper-v2-polished", (0.96, 0.64, 0.54), 1.0, 0.10, "Polished copper"),
        ("copper-v3-brushed", (0.92, 0.60, 0.50), 1.0, 0.30, "Brushed copper"),
        ("copper-v4-satin", (0.94, 0.62, 0.52), 1.0, 0.18, "Satin copper"),
        ("copper-v5-antique", (0.75, 0.45, 0.35), 0.95, 0.38, "Antique copper"),
        ("copper-v6-patina-green", (0.45, 0.55, 0.50), 0.70, 0.55, "Green patina"),
        ("copper-v7-patina-blue", (0.40, 0.50, 0.55), 0.70, 0.52, "Blue patina"),
        ("copper-v8-rose", (0.88, 0.55, 0.48), 1.0, 0.15, "Rose copper"),
        ("copper-v9-matte", (0.85, 0.55, 0.45), 1.0, 0.45, "Matte copper"),
        ("copper-v10-weathered", (0.62, 0.42, 0.35), 0.82, 0.48, "Weathered copper"),
    ],
}


def clear_scene():
    """Remove all objects from scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def setup_render_settings():
    """Configure Cycles renderer for high-quality preview renders"""
    scene = bpy.context.scene

    # Use Cycles for realistic metal rendering
    scene.render.engine = 'CYCLES'

    # GPU acceleration if available
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'  # macOS
    for device in prefs.devices:
        device.use = True
    scene.cycles.device = 'GPU'

    # Render settings - higher quality for selection preview
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True

    # Transparent background
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'


def create_material(name: str, color: tuple, metallic: float, roughness: float):
    """Create a PBR metal material"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    nodes.clear()

    # Principled BSDF
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['IOR'].default_value = 2.5  # Higher IOR for metals

    # Output
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

    return mat


def create_sphere():
    """Create a UV sphere for material preview"""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=64, ring_count=32)
    sphere = bpy.context.active_object

    # Smooth shading
    bpy.ops.object.shade_smooth()

    return sphere


def setup_studio_lighting():
    """Create a 3-point lighting setup optimized for metal materials"""
    # Key light (warm, strong)
    bpy.ops.object.light_add(type='AREA', location=(3, -2, 4))
    key = bpy.context.active_object
    key.name = "Key_Light"
    key.data.energy = 800
    key.data.size = 3
    key.data.color = (1.0, 0.95, 0.9)
    key.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Fill light (cool, softer)
    bpy.ops.object.light_add(type='AREA', location=(-3, -1, 2))
    fill = bpy.context.active_object
    fill.name = "Fill_Light"
    fill.data.energy = 300
    fill.data.size = 4
    fill.data.color = (0.85, 0.9, 1.0)
    fill.rotation_euler = (math.radians(60), 0, math.radians(-45))

    # Rim light (highlight edges)
    bpy.ops.object.light_add(type='AREA', location=(0, 3, 2))
    rim = bpy.context.active_object
    rim.name = "Rim_Light"
    rim.data.energy = 500
    rim.data.size = 2
    rim.data.color = (1.0, 1.0, 1.0)
    rim.rotation_euler = (math.radians(120), 0, math.radians(180))

    # Top accent light
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 5))
    top = bpy.context.active_object
    top.name = "Top_Light"
    top.data.energy = 200
    top.data.size = 5
    top.data.color = (1.0, 1.0, 1.0)
    top.rotation_euler = (0, 0, 0)


def setup_camera():
    """Position camera for material preview"""
    bpy.ops.object.camera_add(location=(3.5, -3.5, 2.5))
    camera = bpy.context.active_object
    camera.name = "Preview_Camera"

    # Point at sphere center
    camera.rotation_euler = (math.radians(65), 0, math.radians(45))

    bpy.context.scene.camera = camera
    return camera


def setup_world():
    """Setup world/environment for metal reflections"""
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        bpy.context.scene.world = world

    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    # Gradient background for nice reflections
    tex_coord = nodes.new('ShaderNodeTexCoord')
    tex_coord.location = (-600, 0)

    gradient = nodes.new('ShaderNodeTexGradient')
    gradient.gradient_type = 'SPHERICAL'
    gradient.location = (-400, 0)

    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.location = (-200, 0)
    color_ramp.color_ramp.elements[0].color = (0.15, 0.15, 0.18, 1.0)
    color_ramp.color_ramp.elements[1].color = (0.35, 0.35, 0.40, 1.0)

    background = nodes.new('ShaderNodeBackground')
    background.location = (0, 0)
    background.inputs['Strength'].default_value = 0.5

    output = nodes.new('ShaderNodeOutputWorld')
    output.location = (200, 0)

    links.new(tex_coord.outputs['Generated'], gradient.inputs['Vector'])
    links.new(gradient.outputs['Color'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], background.inputs['Color'])
    links.new(background.outputs['Background'], output.inputs['Surface'])


def render_variation(metal_type: str, variation: tuple, sphere):
    """Render a single material variation"""
    name, color, metallic, roughness, description = variation

    # Create and apply material
    mat = create_material(name, color, metallic, roughness)
    sphere.data.materials.clear()
    sphere.data.materials.append(mat)

    # Set output path
    output_path = OUTPUT_DIR / f"{name}.png"
    bpy.context.scene.render.filepath = str(output_path)

    # Render
    print(f"  Rendering {name}: {description}")
    bpy.ops.render.render(write_still=True)

    # Clean up material
    bpy.data.materials.remove(mat)

    return output_path


def main():
    """Main rendering function"""
    print("=" * 60)
    print("Metal Material Variation Renderer")
    print("=" * 60)

    # Setup scene
    clear_scene()
    setup_render_settings()
    setup_world()
    setup_studio_lighting()
    camera = setup_camera()
    sphere = create_sphere()

    # Render all variations
    total = sum(len(v) for v in METAL_VARIATIONS.values())
    count = 0

    for metal_type, variations in METAL_VARIATIONS.items():
        print(f"\n[{metal_type.upper()}] Rendering {len(variations)} variations...")

        for variation in variations:
            count += 1
            print(f"  [{count}/{total}] ", end="")
            render_variation(metal_type, variation, sphere)

    print(f"\n{'=' * 60}")
    print(f"Completed! {total} variations rendered to:")
    print(f"  {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
