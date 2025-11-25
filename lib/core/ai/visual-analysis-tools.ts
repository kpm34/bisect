/**
 * Visual Analysis Tools
 * 
 * Provides precise mathematical and color analysis capabilities to support the Material Agent.
 * This bridges the gap between vague language ("make it red") and precise technical values.
 */

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
}

export interface UVMappingResult {
    scale: { x: number, y: number };
    offset: { x: number, y: number };
    rotation: number;
}

export class VisualAnalysisTools {

    /**
     * Analyzes a color description and returns a precise hex code.
     * Can be expanded to use an external API or a larger lookup table.
     */
    static resolveColor(description: string): string {
        const lower = description.toLowerCase();

        // Basic lookup table for common "vague" colors
        const colorMap: Record<string, string> = {
            'red': '#FF0000',
            'dark red': '#8B0000',
            'crimson': '#DC143C',
            'blue': '#0000FF',
            'navy': '#000080',
            'sky blue': '#87CEEB',
            'green': '#008000',
            'forest green': '#228B22',
            'lime': '#00FF00',
            'yellow': '#FFFF00',
            'gold': '#FFD700',
            'orange': '#FFA500',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'white': '#FFFFFF',
            'black': '#000000',
            'grey': '#808080',
            'silver': '#C0C0C0',
            'bronze': '#CD7F32',
            'copper': '#B87333',
        };

        // Check for direct matches
        if (colorMap[lower]) return colorMap[lower];

        // Check for partial matches (e.g. "bright red" -> "red")
        for (const key of Object.keys(colorMap)) {
            if (lower.includes(key)) return colorMap[key];
        }

        return '#FFFFFF'; // Default fallback
    }

    /**
     * Generates a harmonious color palette based on a base color.
     */
    static generatePalette(baseColorHex: string): ColorPalette {
        // Mock implementation of color harmony logic
        // In a real version, this would use HSL manipulation
        return {
            primary: baseColorHex,
            secondary: '#CCCCCC', // Placeholder
            accent: '#FF0000',    // Placeholder
            background: '#FFFFFF' // Placeholder
        };
    }

    /**
     * Calculates optimal UV scale for a texture based on object dimensions.
     * Ensures consistent texture density across different sized objects.
     * 
     * @param objectSize Dimensions of the object {x, y, z}
     * @param textureRealWorldSize The real-world size the texture represents (e.g., 1 meter)
     */
    static calculateOptimalUVScale(
        objectSize: { x: number, y: number, z: number },
        textureRealWorldSize: number = 1.0
    ): UVMappingResult {
        // Calculate scale factors
        // If object is 2m wide and texture is 1m, we need to tile it 2 times.

        const scaleX = objectSize.x / textureRealWorldSize;
        const scaleY = objectSize.y / textureRealWorldSize; // Assuming Y is up/height

        // For a simple box mapping, we usually want uniform scaling
        // But for specific faces, we might want anisotropic scaling

        return {
            scale: { x: scaleX, y: scaleY },
            offset: { x: 0, y: 0 },
            rotation: 0
        };
    }

    /**
     * Suggests normal map intensity based on material type.
     */
    static suggestNormalIntensity(materialType: string): number {
        const lower = materialType.toLowerCase();

        if (lower.includes('brick') || lower.includes('stone') || lower.includes('rock')) return 1.0;
        if (lower.includes('wood')) return 0.5;
        if (lower.includes('fabric') || lower.includes('cloth')) return 0.3;
        if (lower.includes('plastic') || lower.includes('metal')) return 0.1;

        return 0.5; // Default
    }
}
