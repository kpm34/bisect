#!/usr/bin/env python3
"""
Glass Materials Renderer (Production Quality)

Renders all 39 glass material presets as sphere previews using Blender.
Run with: /path/to/blender --background --python render-glass-materials.py

Output: Creates 512x512 PNG images for each glass preset

Enhanced with:
- Noise/imperfections for realism
- Fresnel edge reflections
- Depth absorption for tinted glass
- Dispersion for chromatic aberration
- Proper caustics and light bounces
"""

import bpy
import os
import math
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "assets" / "materials" / "glass"

# Glass materials from Supabase (39 presets across 5 tabs)
GLASS_MATERIALS = [
    # CLEAR TAB (4 presets)
    {"id": "glass-clear-standard", "name": "Standard", "tab": "Clear", "color": "#f4fbff", "roughness": 0.05,
     "transmission": 0.95, "thickness": 0.5, "ior": 1.5},
    {"id": "glass-clear-crystal", "name": "Crystal", "tab": "Clear", "color": "#ffffff", "roughness": 0.02,
     "transmission": 0.98, "thickness": 0.3, "ior": 1.52},
    {"id": "glass-clear-window", "name": "Window", "tab": "Clear", "color": "#e8f4f8", "roughness": 0.08,
     "transmission": 0.92, "thickness": 0.6, "ior": 1.5},
    {"id": "glass-clear-thin", "name": "Thin", "tab": "Clear", "color": "#fafeff", "roughness": 0.03,
     "transmission": 0.97, "thickness": 0.2, "ior": 1.5},

    # TINTED TAB (7 presets)
    {"id": "glass-tinted-amber", "name": "Amber", "tab": "Tinted", "color": "#f8d4a5", "roughness": 0.12,
     "transmission": 0.85, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#f8a540", "attenuation_distance": 0.5},
    {"id": "glass-tinted-blue", "name": "Blue", "tab": "Tinted", "color": "#c3e4ff", "roughness": 0.08,
     "transmission": 0.88, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#4080ff", "attenuation_distance": 0.5},
    {"id": "glass-tinted-green", "name": "Green", "tab": "Tinted", "color": "#a8e6a1", "roughness": 0.08,
     "transmission": 0.88, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#40a040", "attenuation_distance": 0.5},
    {"id": "glass-tinted-smoke", "name": "Smoke", "tab": "Tinted", "color": "#b0c4cc", "roughness": 0.15,
     "transmission": 0.85, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#404040", "attenuation_distance": 0.4},
    {"id": "glass-tinted-red", "name": "Red", "tab": "Tinted", "color": "#d94848", "roughness": 0.12,
     "transmission": 0.80, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#c02020", "attenuation_distance": 0.3},
    {"id": "glass-tinted-purple", "name": "Purple", "tab": "Tinted", "color": "#c8a8e6", "roughness": 0.10,
     "transmission": 0.86, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#8040c0", "attenuation_distance": 0.5},
    {"id": "glass-tinted-rose", "name": "Rose", "tab": "Tinted", "color": "#f8c8d4", "roughness": 0.10,
     "transmission": 0.87, "thickness": 0.5, "ior": 1.5, "attenuation_color": "#e06080", "attenuation_distance": 0.5},

    # FROSTED TAB (6 presets)
    {"id": "glass-frosted-satin", "name": "Satin", "tab": "Frosted", "color": "#dfe7ee", "roughness": 0.35,
     "transmission": 0.70, "thickness": 0.5, "ior": 1.5},
    {"id": "glass-frosted-etched", "name": "Etched", "tab": "Frosted", "color": "#e8eef2", "roughness": 0.45,
     "transmission": 0.60, "thickness": 0.5, "ior": 1.5},
    {"id": "glass-frosted-privacy", "name": "Privacy", "tab": "Frosted", "color": "#d8e0e8", "roughness": 0.55,
     "transmission": 0.50, "thickness": 0.6, "ior": 1.5},
    {"id": "glass-frosted-ice", "name": "Ice", "tab": "Frosted", "color": "#e0f4ff", "roughness": 0.40,
     "transmission": 0.65, "thickness": 0.4, "ior": 1.31},
    {"id": "glass-frosted-ripple", "name": "Ripple", "tab": "Frosted", "color": "#e8f4f8", "roughness": 0.25,
     "transmission": 0.75, "thickness": 0.6, "ior": 1.5},
    {"id": "glass-frosted-rain", "name": "Rain", "tab": "Frosted", "color": "#e4eef4", "roughness": 0.30,
     "transmission": 0.72, "thickness": 0.5, "ior": 1.5},

    # MATCAP TAB (12 presets)
    {"id": "glass-matcap-chrome", "name": "Chrome", "tab": "MatCap", "color": "#c0c8d0", "roughness": 0.05,
     "transmission": 0.3, "thickness": 0.2, "ior": 2.0, "clearcoat": 1.0},
    {"id": "glass-matcap-pearl", "name": "Pearl", "tab": "MatCap", "color": "#f8f4f0", "roughness": 0.15,
     "transmission": 0.4, "thickness": 0.3, "ior": 1.6, "iridescence": 0.5, "iridescence_ior": 1.3},
    {"id": "glass-matcap-obsidian", "name": "Obsidian", "tab": "MatCap", "color": "#1a1a20", "roughness": 0.08,
     "transmission": 0.2, "thickness": 0.8, "ior": 1.5, "clearcoat": 0.9},
    {"id": "glass-matcap-jade", "name": "Jade", "tab": "MatCap", "color": "#68c080", "roughness": 0.20,
     "transmission": 0.35, "thickness": 1.0, "ior": 1.6, "attenuation_color": "#306040"},
    {"id": "glass-matcap-sapphire", "name": "Sapphire", "tab": "MatCap", "color": "#2850a8", "roughness": 0.05,
     "transmission": 0.45, "thickness": 0.6, "ior": 1.77, "clearcoat": 0.9},
    {"id": "glass-matcap-ruby", "name": "Ruby", "tab": "MatCap", "color": "#c01040", "roughness": 0.05,
     "transmission": 0.40, "thickness": 0.6, "ior": 1.77, "clearcoat": 0.9},
    {"id": "glass-matcap-emerald", "name": "Emerald", "tab": "MatCap", "color": "#20a050", "roughness": 0.05,
     "transmission": 0.42, "thickness": 0.6, "ior": 1.58, "clearcoat": 0.9},
    {"id": "glass-matcap-opal", "name": "Opal", "tab": "MatCap", "color": "#e8e0f0", "roughness": 0.18,
     "transmission": 0.50, "thickness": 0.4, "ior": 1.45, "iridescence": 0.8, "iridescence_ior": 1.5},
    {"id": "glass-matcap-onyx", "name": "Onyx", "tab": "MatCap", "color": "#101015", "roughness": 0.10,
     "transmission": 0.15, "thickness": 1.0, "ior": 1.5, "clearcoat": 0.85},
    {"id": "glass-matcap-moonstone", "name": "Moonstone", "tab": "MatCap", "color": "#d0d8e8", "roughness": 0.22,
     "transmission": 0.55, "thickness": 0.5, "ior": 1.52, "iridescence": 0.4},
    {"id": "glass-matcap-aquamarine", "name": "Aquamarine", "tab": "MatCap", "color": "#70c8d8", "roughness": 0.08,
     "transmission": 0.60, "thickness": 0.5, "ior": 1.58, "clearcoat": 0.8},
    {"id": "glass-matcap-amethyst", "name": "Amethyst", "tab": "MatCap", "color": "#9060c0", "roughness": 0.08,
     "transmission": 0.45, "thickness": 0.6, "ior": 1.55, "clearcoat": 0.85},

    # SPECIALTY TAB (10 presets) - with dispersion for chromatic aberration
    {"id": "glass-specialty-dichroic", "name": "Dichroic", "tab": "Specialty", "color": "#80c0f0", "roughness": 0.05,
     "transmission": 0.75, "thickness": 0.3, "ior": 1.5, "iridescence": 1.0, "iridescence_ior": 2.0, "clearcoat": 0.9,
     "dispersion": 0.3},
    {"id": "glass-specialty-holographic", "name": "Holographic", "tab": "Specialty", "color": "#e0e8ff", "roughness": 0.08,
     "transmission": 0.60, "thickness": 0.2, "ior": 1.5, "iridescence": 0.9, "iridescence_ior": 1.8, "clearcoat": 0.85,
     "dispersion": 0.2},
    {"id": "glass-specialty-prismatic", "name": "Prismatic", "tab": "Specialty", "color": "#f0f4ff", "roughness": 0.02,
     "transmission": 0.90, "thickness": 0.4, "ior": 2.4, "clearcoat": 1.0, "dispersion": 0.8},
    {"id": "glass-specialty-bubble", "name": "Bubble", "tab": "Specialty", "color": "#e8f8ff", "roughness": 0.03,
     "transmission": 0.92, "thickness": 0.1, "ior": 1.0, "iridescence": 0.6, "iridescence_ior": 1.3, "thin_film": True},
    {"id": "glass-specialty-neon-pink", "name": "Neon Pink", "tab": "Specialty", "color": "#ff40a0", "roughness": 0.10,
     "transmission": 0.70, "thickness": 0.4, "ior": 1.5, "emission": "#ff40a0", "emission_strength": 0.5},
    {"id": "glass-specialty-neon-blue", "name": "Neon Blue", "tab": "Specialty", "color": "#40c0ff", "roughness": 0.10,
     "transmission": 0.70, "thickness": 0.4, "ior": 1.5, "emission": "#40c0ff", "emission_strength": 0.5},
    {"id": "glass-specialty-aurora", "name": "Aurora", "tab": "Specialty", "color": "#60e0c0", "roughness": 0.12,
     "transmission": 0.65, "thickness": 0.5, "ior": 1.5, "iridescence": 0.7, "iridescence_ior": 1.6, "dispersion": 0.15},
    {"id": "glass-specialty-oil-slick", "name": "Oil Slick", "tab": "Specialty", "color": "#304050", "roughness": 0.15,
     "transmission": 0.40, "thickness": 0.2, "ior": 1.5, "iridescence": 1.0, "iridescence_ior": 1.4, "clearcoat": 0.9,
     "thin_film": True},
    {"id": "glass-specialty-diamond", "name": "Diamond", "tab": "Specialty", "color": "#f8fcff", "roughness": 0.01,
     "transmission": 0.95, "thickness": 0.3, "ior": 2.42, "clearcoat": 1.0, "dispersion": 0.6},
    {"id": "glass-specialty-galaxy", "name": "Galaxy", "tab": "Specialty", "color": "#1a1040", "roughness": 0.20,
     "transmission": 0.30, "thickness": 1.0, "ior": 1.5, "iridescence": 0.5, "subsurface": 0.2},
]

# Material enhancement settings
ENHANCEMENT_CONFIG = {
    "add_noise_imperfections": True,  # Subtle noise on bump for realism
    "noise_scale": 50.0,              # Scale of noise pattern
    "noise_strength": 0.02,           # Very subtle - just for micro surface detail
    "use_volume_absorption": True,    # For tinted glass depth
    "fresnel_enhance": True,          # Edge reflection boost
}


def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple (0-1 range)"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))


def setup_scene():
    """Setup a clean scene with proper lighting for glass material preview"""
    # Clear default scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Create sphere for material preview
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

    # Create a ground plane for reflections (important for glass)
    bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -1.2))
    ground = bpy.context.active_object
    ground.name = "Ground"

    # Create ground material (dark matte)
    ground_mat = bpy.data.materials.new(name="GroundMaterial")
    ground_mat.use_nodes = True
    ground_bsdf = ground_mat.node_tree.nodes.get("Principled BSDF")
    if ground_bsdf:
        ground_bsdf.inputs["Base Color"].default_value = (0.1, 0.1, 0.12, 1.0)
        ground_bsdf.inputs["Roughness"].default_value = 0.8
    ground.data.materials.append(ground_mat)

    # Setup camera
    bpy.ops.object.camera_add(location=(3, -3, 2.5))
    camera = bpy.context.active_object
    camera.name = "PreviewCamera"
    camera.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = camera

    # Setup world/environment (crucial for glass materials)
    world = bpy.data.worlds.new("PreviewWorld")
    bpy.context.scene.world = world
    world.use_nodes = True

    nodes = world.node_tree.nodes
    links = world.node_tree.links

    # Clear default nodes
    nodes.clear()

    # Try to load a studio HDRI
    hdri_path = None
    blender_path = bpy.utils.resource_path('LOCAL')
    possible_hdris = [
        os.path.join(blender_path, "datafiles", "studiolights", "world", "interior.exr"),
        os.path.join(blender_path, "datafiles", "studiolights", "world", "city.exr"),
        os.path.join(blender_path, "datafiles", "studiolights", "world", "courtyard.exr"),
    ]

    for path in possible_hdris:
        if os.path.exists(path):
            hdri_path = path
            break

    if hdri_path:
        # Use actual HDRI
        node_background = nodes.new(type='ShaderNodeBackground')
        node_environment = nodes.new(type='ShaderNodeTexEnvironment')
        node_output = nodes.new(type='ShaderNodeOutputWorld')

        node_environment.image = bpy.data.images.load(hdri_path)
        links.new(node_environment.outputs['Color'], node_background.inputs['Color'])
        node_background.inputs['Strength'].default_value = 1.2
        links.new(node_background.outputs['Background'], node_output.inputs['Surface'])
        print(f"Using HDRI: {hdri_path}")
    else:
        # Fallback to gradient background
        node_background = nodes.new(type='ShaderNodeBackground')
        node_output = nodes.new(type='ShaderNodeOutputWorld')
        node_gradient = nodes.new(type='ShaderNodeTexGradient')
        node_mapping = nodes.new(type='ShaderNodeMapping')
        node_texcoord = nodes.new(type='ShaderNodeTexCoord')
        node_colorramp = nodes.new(type='ShaderNodeValToRGB')

        node_gradient.gradient_type = 'SPHERICAL'
        node_colorramp.color_ramp.elements[0].color = (0.9, 0.92, 0.95, 1)
        node_colorramp.color_ramp.elements[1].color = (0.4, 0.45, 0.5, 1)

        links.new(node_texcoord.outputs['Generated'], node_mapping.inputs['Vector'])
        links.new(node_mapping.outputs['Vector'], node_gradient.inputs['Vector'])
        links.new(node_gradient.outputs['Fac'], node_colorramp.inputs['Fac'])
        links.new(node_colorramp.outputs['Color'], node_background.inputs['Color'])
        node_background.inputs['Strength'].default_value = 1.5
        links.new(node_background.outputs['Background'], node_output.inputs['Surface'])
        print("No HDRI found, using gradient background")

    # Add 3-point lighting (important for glass to show refractions)
    # Key light - main light source
    bpy.ops.object.light_add(type='AREA', location=(4, -2, 4))
    key_light = bpy.context.active_object
    key_light.name = "KeyLight"
    key_light.data.energy = 300
    key_light.data.size = 3
    key_light.rotation_euler = (math.radians(45), 0, math.radians(30))

    # Fill light - softer, fills shadows
    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 2))
    fill_light = bpy.context.active_object
    fill_light.name = "FillLight"
    fill_light.data.energy = 100
    fill_light.data.size = 4
    fill_light.rotation_euler = (math.radians(60), 0, math.radians(-45))

    # Rim light - creates edge highlights
    bpy.ops.object.light_add(type='AREA', location=(0, 4, 2))
    rim_light = bpy.context.active_object
    rim_light.name = "RimLight"
    rim_light.data.energy = 200
    rim_light.data.size = 2
    rim_light.rotation_euler = (math.radians(70), 0, math.radians(180))

    # Add a subtle backlight for glass caustics
    bpy.ops.object.light_add(type='POINT', location=(0, 2, 0))
    back_light = bpy.context.active_object
    back_light.name = "BackLight"
    back_light.data.energy = 50
    back_light.data.shadow_soft_size = 0.5

    return sphere


def create_glass_material(glass):
    """Create a production-quality glass material with noise, fresnel, and depth effects"""
    mat = bpy.data.materials.new(name=glass["id"])
    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Get principled BSDF and output
    principled = nodes.get("Principled BSDF")
    output = nodes.get("Material Output")

    if principled:
        # Base color
        color = hex_to_rgb(glass["color"])
        principled.inputs["Base Color"].default_value = (*color, 1.0)

        # Core glass properties
        principled.inputs["Roughness"].default_value = glass["roughness"]
        principled.inputs["Metallic"].default_value = 0.0  # Glass is non-metallic

        # Transmission (key for glass)
        principled.inputs["Transmission Weight"].default_value = glass["transmission"]

        # IOR (Index of Refraction) - Fresnel is automatically handled by Blender
        principled.inputs["IOR"].default_value = glass["ior"]

        # Clearcoat for extra shine (gem-like materials)
        clearcoat = glass.get("clearcoat", 0)
        if clearcoat > 0:
            principled.inputs["Coat Weight"].default_value = clearcoat
            principled.inputs["Coat Roughness"].default_value = 0.05  # Very smooth coat

        # Emission for neon effects
        if "emission" in glass:
            emission_color = hex_to_rgb(glass["emission"])
            principled.inputs["Emission Color"].default_value = (*emission_color, 1.0)
            principled.inputs["Emission Strength"].default_value = glass.get("emission_strength", 0.5)

        # Subsurface for translucent materials (Galaxy glass)
        if glass.get("subsurface", 0) > 0:
            principled.inputs["Subsurface Weight"].default_value = glass["subsurface"]
            principled.inputs["Subsurface Radius"].default_value = (0.5, 0.3, 0.2)

        # Alpha (for proper glass rendering)
        principled.inputs["Alpha"].default_value = 1.0

        # ============================================
        # NOISE IMPERFECTIONS (subtle bump for realism)
        # ============================================
        if ENHANCEMENT_CONFIG["add_noise_imperfections"] and glass["roughness"] > 0.01:
            # Create noise texture for micro-surface detail
            noise_tex = nodes.new(type='ShaderNodeTexNoise')
            noise_tex.inputs['Scale'].default_value = ENHANCEMENT_CONFIG["noise_scale"]
            noise_tex.inputs['Detail'].default_value = 8.0
            noise_tex.inputs['Roughness'].default_value = 0.5
            noise_tex.location = (-400, -200)

            # Texture coordinates
            tex_coord = nodes.new(type='ShaderNodeTexCoord')
            tex_coord.location = (-600, -200)

            # Bump map node
            bump = nodes.new(type='ShaderNodeBump')
            bump.inputs['Strength'].default_value = ENHANCEMENT_CONFIG["noise_strength"]
            bump.inputs['Distance'].default_value = 0.01
            bump.location = (-200, -200)

            # Connect noise to bump
            links.new(tex_coord.outputs['Object'], noise_tex.inputs['Vector'])
            links.new(noise_tex.outputs['Fac'], bump.inputs['Height'])
            links.new(bump.outputs['Normal'], principled.inputs['Normal'])

        # ============================================
        # VOLUME ABSORPTION (depth color for tinted glass)
        # ============================================
        if ENHANCEMENT_CONFIG["use_volume_absorption"] and "attenuation_color" in glass:
            att_color = hex_to_rgb(glass["attenuation_color"])
            att_distance = glass.get("attenuation_distance", 0.5)

            # Create volume absorption node
            volume_absorb = nodes.new(type='ShaderNodeVolumeAbsorption')
            volume_absorb.inputs['Color'].default_value = (*att_color, 1.0)
            volume_absorb.inputs['Density'].default_value = 1.0 / att_distance
            volume_absorb.location = (200, -300)

            # Connect to volume output
            links.new(volume_absorb.outputs['Volume'], output.inputs['Volume'])

        # ============================================
        # FROSTED GLASS TEXTURE (for Frosted tab materials)
        # ============================================
        if glass.get("tab") == "Frosted" and glass["roughness"] >= 0.25:
            # Use Voronoi texture for frosted/etched look
            voronoi = nodes.new(type='ShaderNodeTexVoronoi')
            voronoi.feature = 'DISTANCE_TO_EDGE'
            voronoi.inputs['Scale'].default_value = 30.0
            voronoi.location = (-400, -400)

            # Texture coordinates
            if not any(n.type == 'TEX_COORD' for n in nodes):
                tex_coord = nodes.new(type='ShaderNodeTexCoord')
                tex_coord.location = (-600, -400)
            else:
                tex_coord = next(n for n in nodes if n.type == 'TEX_COORD')

            # Bump for frosted texture
            frost_bump = nodes.new(type='ShaderNodeBump')
            frost_bump.inputs['Strength'].default_value = 0.15
            frost_bump.inputs['Distance'].default_value = 0.02
            frost_bump.location = (-200, -400)

            links.new(tex_coord.outputs['Object'], voronoi.inputs['Vector'])
            links.new(voronoi.outputs['Distance'], frost_bump.inputs['Height'])

            # If we already have a bump from noise, mix the normals
            existing_bump = next((n for n in nodes if n.type == 'BUMP' and n != frost_bump), None)
            if existing_bump:
                # Connect frost bump to existing bump's normal input
                links.new(frost_bump.outputs['Normal'], existing_bump.inputs['Normal'])
            else:
                links.new(frost_bump.outputs['Normal'], principled.inputs['Normal'])

        # ============================================
        # THIN FILM INTERFERENCE (soap bubble effect)
        # ============================================
        if glass.get("thin_film"):
            # Add layer weight for thin film effect
            layer_weight = nodes.new(type='ShaderNodeLayerWeight')
            layer_weight.inputs['Blend'].default_value = 0.5
            layer_weight.location = (-400, 100)

            # Color ramp for rainbow thin film
            color_ramp = nodes.new(type='ShaderNodeValToRGB')
            color_ramp.location = (-200, 100)
            # Rainbow gradient
            cr = color_ramp.color_ramp
            cr.elements[0].position = 0.0
            cr.elements[0].color = (1, 0.3, 0.3, 1)  # Red
            cr.elements[1].position = 1.0
            cr.elements[1].color = (0.3, 0.3, 1, 1)  # Blue
            # Add more colors
            cr.elements.new(0.25).color = (1, 0.8, 0.2, 1)  # Yellow
            cr.elements.new(0.5).color = (0.2, 1, 0.4, 1)   # Green
            cr.elements.new(0.75).color = (0.4, 0.6, 1, 1)  # Cyan

            links.new(layer_weight.outputs['Facing'], color_ramp.inputs['Fac'])

            # Mix with base color
            mix_rgb = nodes.new(type='ShaderNodeMixRGB')
            mix_rgb.blend_type = 'OVERLAY'
            mix_rgb.inputs['Fac'].default_value = 0.3
            mix_rgb.inputs['Color1'].default_value = (*color, 1.0)
            mix_rgb.location = (0, 100)

            links.new(color_ramp.outputs['Color'], mix_rgb.inputs['Color2'])
            links.new(mix_rgb.outputs['Color'], principled.inputs['Base Color'])

    # Material settings for glass (Blender 4.5+ API)
    # Note: blend_method and shadow_method are EEVEE-specific
    # For Cycles rendering, these are not needed but we set for EEVEE preview
    if hasattr(mat, 'blend_method'):
        mat.blend_method = 'HASHED'
    if hasattr(mat, 'shadow_method'):
        mat.shadow_method = 'HASHED'
    if hasattr(mat, 'use_screen_refraction'):
        mat.use_screen_refraction = True

    return mat


def setup_render_settings():
    """Configure render settings for production-quality glass preview images"""
    scene = bpy.context.scene

    # Use Cycles for accurate glass rendering (required for caustics/volume)
    scene.render.engine = 'CYCLES'

    # GPU if available (Metal for macOS)
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()

    for device in prefs.devices:
        device.use = True

    scene.cycles.device = 'GPU'

    # ============================================
    # HIGH QUALITY SETTINGS FOR GLASS
    # ============================================
    scene.cycles.samples = 384            # Higher samples for clean glass
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'

    # Enable caustics for realistic glass (light bending/focusing)
    scene.cycles.caustics_reflective = True
    scene.cycles.caustics_refractive = True

    # Light paths for glass - need many bounces for proper refraction
    scene.cycles.max_bounces = 16
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 8
    scene.cycles.transmission_bounces = 16    # Critical for glass
    scene.cycles.volume_bounces = 4           # For absorption
    scene.cycles.transparent_max_bounces = 16

    # Clamping to reduce fireflies (bright spots)
    scene.cycles.sample_clamp_indirect = 10.0

    # ============================================
    # OUTPUT SETTINGS
    # ============================================
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '16'  # Higher bit depth
    scene.render.film_transparent = True  # Transparent background

    # Color management for accurate colors
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0


def render_glass(sphere, glass, output_dir):
    """Render a single glass material"""
    # Create and apply material
    mat = create_glass_material(glass)

    if sphere.data.materials:
        sphere.data.materials[0] = mat
    else:
        sphere.data.materials.append(mat)

    # Create tab subdirectory
    tab_dir = output_dir / glass["tab"].lower()
    tab_dir.mkdir(parents=True, exist_ok=True)

    # Set output path
    output_path = tab_dir / f"{glass['id']}.png"
    bpy.context.scene.render.filepath = str(output_path)

    # Render
    print(f"Rendering: {glass['name']} ({glass['id']})")
    bpy.ops.render.render(write_still=True)

    print(f"  -> Saved to: {output_path}")

    return output_path


def main():
    """Main rendering pipeline"""
    print("\n" + "=" * 60)
    print("Glass Materials Renderer")
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

    # Group by tab for organized output
    tabs = {}
    for glass in GLASS_MATERIALS:
        tab = glass["tab"]
        if tab not in tabs:
            tabs[tab] = []
        tabs[tab].append(glass)

    # Render each material
    total = len(GLASS_MATERIALS)
    print(f"\nRendering {total} glass materials across {len(tabs)} tabs...")
    print("-" * 40)

    rendered_files = []
    count = 0
    for tab_name, glasses in tabs.items():
        print(f"\n[{tab_name}] ({len(glasses)} materials)")
        for glass in glasses:
            count += 1
            print(f"\n[{count}/{total}] {glass['name']}")
            output_path = render_glass(sphere, glass, OUTPUT_DIR)
            rendered_files.append(output_path)

    print("\n" + "=" * 60)
    print("Rendering Complete!")
    print(f"Generated {len(rendered_files)} preview images")
    print("=" * 60)

    return rendered_files


if __name__ == "__main__":
    main()
