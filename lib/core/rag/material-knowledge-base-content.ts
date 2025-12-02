export const materialKnowledgeBase = `# Material Knowledge Base

This document contains comprehensive PBR (Physically Based Rendering) workflows and "recipes" for various material categories. It is intended to be ingested by the RAG system to assist the AI in generating accurate material properties.

## 1. Fabric
Fabrics are characterized by their weave structure, softness (sheen), and lack of metallic properties.

### Cotton / Canvas
- **Color**: Any (Albedo).
- **Roughness**: 0.8 - 0.9 (Very matte, absorbs light).
- **Metalness**: 0.0.
- **Normal Map**: Essential. Needs a tight weave pattern.
- **Sheen**: High. Simulates micro-fibers catching light at grazing angles.
- **Workflow**: Start with a base color. Apply a high roughness (0.8+). Use a "Fabric" or "Cloth" normal map. Increase "Sheen" to simulate the fuzziness.

### Silk / Satin
- **Color**: Vibrant, often saturated.
- **Roughness**: 0.4 - 0.6 (Smooth but anisotropic).
- **Metalness**: 0.0 (Sometimes 0.4-0.6 in stylized PBR to simulate high sheen).
- **Anisotropy**: 0.5 - 0.8 (Highlights stretch along the thread direction).
- **Sheen**: Medium.
- **Workflow**: Lower roughness than cotton. Use Anisotropy to create the characteristic "stretched" highlights.

### Denim
- **Color**: Blue/Indigo with white weave variations.
- **Roughness**: 0.8 - 0.9.
- **Metalness**: 0.0.
- **Normal Map**: Diagonal weave pattern (Twill).
- **Workflow**: The color map is crucial here—it needs the white/blue variation. High roughness.

## 2. Ceramic
Ceramics are non-metallic, often coated with a glass-like glaze.

### Glazed Porcelain (Shiny)
- **Color**: White or painted patterns.
- **Roughness**: 0.0 - 0.1 (Extremely glossy glaze).
- **Metalness**: 0.0.
- **Clearcoat**: 1.0 (Optional, but helps simulate the glaze layer over the clay).
- **Workflow**: Base color is the clay/paint. The "shine" comes from low roughness. If using Clearcoat, keep base roughness slightly higher (0.3) and Clearcoat roughness low (0.0).

### Unglazed Clay / Terracotta
- **Color**: Orange/Brown/Red earth tones.
- **Roughness**: 0.6 - 0.9 (Rough, porous).
- **Metalness**: 0.0.
- **Workflow**: High roughness. Needs a noise texture in the Normal map to simulate the porous surface.

## 3. Metal
Metals are defined by their conductivity. Pure metals have Metalness = 1.0.

### Gold
- **Color**: #FFD700 (Gold).
- **Roughness**: 0.1 - 0.3 (Polished) to 0.6 (Rough cast).
- **Metalness**: 1.0.
- **Workflow**: Pure Metalness. Yellow/Orange Albedo. Low roughness for polished look.

### Silver / Chrome
- **Color**: #C0C0C0 (Light Grey) to #FFFFFF.
- **Roughness**: 0.05 - 0.2 (Polished).
- **Metalness**: 1.0.
- **Workflow**: Pure Metalness. Needs environment map for reflections.

### Copper
- **Color**: #B87333 (Copper).
- **Roughness**: 0.1 - 0.3 (Polished) to 0.6 (Hammered/Aged).
- **Metalness**: 1.0.
- **Workflow**: Distinctive reddish-orange Albedo.

### Rusted Iron
- **Color**: Dark Grey (Iron) mixed with Red/Orange (Rust).
- **Roughness**: 0.4 (Iron) to 0.7-1.0 (Rust).
- **Metalness**: 1.0 (Iron) mixed with 0.0 (Rust).
- **Workflow**: Mixed material. Rust is dielectric (Metalness 0) and very rough (0.8+). Iron is metallic (Metalness 1). Use a mask to blend.

## 4. Stone
Stones are generally dielectric (non-metal). Specular is typically 0.5.

### Polished Marble / Granite
- **Color**: Veined or granular pattern.
- **Roughness**: 0.1 - 0.3 (Smooth, reflective).
- **Metalness**: 0.0.
- **Specular**: 0.5 (IOR ~1.5).
- **Subsurface Scattering (SSS)**: Low (0.1 - 0.2) for marble to simulate depth.
- **Workflow**: Low roughness is key for the "polished" look.

### Rough Stone / Concrete
- **Color**: Grey/Beige with noise.
- **Roughness**: 0.6 - 0.9 (Matte).
- **Metalness**: 0.0.
- **Normal Map**: High intensity noise/pitting.
- **Workflow**: High roughness. Texture maps are crucial for realism.

## 5. Wood
Wood is a complex organic material. Metalness is always 0.0.

### Polished Wood
- **Color**: Rich Brown/Mahogany.
- **Roughness**: 0.2 - 0.3 (Glossy finish).
- **Metalness**: 0.0.
- **Workflow**: Low roughness simulates the wax/polish.

### Varnished / Semi-Gloss Wood
- **Color**: Stained wood.
- **Roughness**: 0.3 - 0.6.
- **Metalness**: 0.0.
- **Clearcoat**: 1.0 (Simulates the varnish layer).
- **Workflow**: Use Clearcoat for the varnish layer over the wood grain.

### Raw / Worn Wood
- **Color**: Desaturated brown/grey.
- **Roughness**: 0.7 - 0.9.
- **Metalness**: 0.0.
- **Normal Map**: Strong grain direction.
- **Workflow**: High roughness. No specular highlights.

## 6. Glass
Glass relies on Transmission (Refraction). Metalness is 0.0.

### Clear Glass
- **Color**: White (or very faint tint).
- **Roughness**: 0.0 (Perfectly smooth).
- **Metalness**: 0.0.
- **Transmission**: 1.0.
- **IOR**: 1.52.
- **Opacity**: ~0.5 (depending on renderer).
- **Workflow**: Enable Transmission. IOR 1.52 is standard for glass.

### Frosted Glass
- **Color**: White.
- **Roughness**: 0.2 - 0.5 (Diffuses the refraction).
- **Transmission**: 1.0.
- **IOR**: 1.52.
- **Workflow**: Increase roughness to blur the background seen through the glass.

### Tinted Glass
- **Color**: Desired tint (Blue, Green, etc.).
- **Roughness**: 0.0 (usually smooth).
- **Transmission**: 1.0.
- **Workflow**: Set Albedo to the tint color.

## 7. Plastic
Plastics are smooth dielectrics.

### Glossy Plastic
- **Color**: Any.
- **Roughness**: 0.0 - 0.2.
- **Metalness**: 0.0.
- **Workflow**: Simple low roughness, non-metal.

### Matte / Textured Plastic
- **Color**: Any.
- **Roughness**: 0.4 - 0.7.
- **Metalness**: 0.0.
- **Normal Map**: Fine noise (Mold texture).
- **Workflow**: Higher roughness. Often needs a bump map.

## 8. Texture Maps & Usage
Understanding how to use specific texture maps is critical for realistic PBR materials.

### Albedo (Base Color)
- **Definition**: The pure color of the surface without lighting or shadows.
- **Usage**: Plug into "Color" or "Base Color".
- **Rules**:
  - No baked shadows or highlights.
  - For Metals: Represents the reflection color (e.g., Gold is yellow).
  - For Non-Metals: Represents the diffuse surface color.

### Normal Map
- **Definition**: Simulates surface detail (bumps, scratches) by altering light reflection angles.
- **Usage**: Plug into "Normal".
- **Color Space**: Must be **Non-Color** (Linear).
- **Appearance**: Purple/Blue.
- **Tip**: Essential for Fabric (weave), Wood (grain), and Stone (pitting).

### Roughness Map
- **Definition**: Defines how smooth or rough the surface is at a microscopic level.
- **Usage**: Plug into "Roughness".
- **Values**:
  - **Black (0.0)**: Perfectly smooth (Mirror-like).
  - **White (1.0)**: Completely rough (Matte).
- **Tip**: Use a noise texture or grunge map here to break up perfect reflections and add realism (fingerprints, dust).

### Metalness Map
- **Definition**: Defines which parts of the surface are metal.
- **Usage**: Plug into "Metalness" or "Metallic".
- **Values**:
  - **White (1.0)**: Metal.
  - **Black (0.0)**: Non-Metal (Dielectric).
- **Tip**: Avoid grey values unless simulating transition zones like rust or dirt on metal.

### Ambient Occlusion (AO)
- **Definition**: Simulates soft shadows in crevices.
- **Usage**: Multiply with Albedo or plug into dedicated "AO" slot.
- **Tip**: Adds depth to Fabric folds, Wood cracks, and Stone pores.

### Emissive Map
- **Definition**: Makes the surface emit light.
- **Usage**: Plug into "Emission".
- **Tip**: Use for screens, LEDs, or magical effects. Black areas emit no light.
`;
