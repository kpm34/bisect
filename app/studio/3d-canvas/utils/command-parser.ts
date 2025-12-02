/**
 * Natural Language Command Parser for Bisect 3D Canvas
 *
 * Parses user commands into structured actions for scene editing.
 * Supports:
 * - Object selection: "select cube", "pick the sphere"
 * - Material editing: "make it red", "set roughness to 0.5"
 * - Transform editing: "move to 0 5 0", "rotate 90 degrees"
 */

export interface ParsedCommand {
  type: 'select' | 'material' | 'transform' | 'unknown';
  action?: string;
  target?: string;
  params?: any;
  raw: string;
}

/**
 * Parse a natural language command into structured action
 */
export function parseCommand(text: string): ParsedCommand {
  const normalized = text.toLowerCase().trim();

  // Selection commands
  const selectMatch = normalized.match(/(?:select|pick|choose|focus on)\s+(?:the\s+)?(.+?)(?:\s|$)/);
  if (selectMatch) {
    return {
      type: 'select',
      action: 'select',
      target: selectMatch[1].trim(),
      raw: text,
    };
  }

  // Extract object name if "the X" or "my X" pattern exists
  const targetMatch = normalized.match(/(?:the|my|this)\s+(\w+)/);
  const target = targetMatch ? targetMatch[1] : undefined;

  // Material commands

  // Color commands
  const colorMatch = normalized.match(/(?:make it|make|color|set color to|paint)\s+(?:#[0-9a-f]{6}|red|green|blue|yellow|purple|pink|white|black|orange|cyan|magenta|gray|grey)/);
  if (colorMatch) {
    const colorStr = colorMatch[0].split(/make it|make|color|set color to|paint/).pop()?.trim();
    return {
      type: 'material',
      action: 'setColor',
      target,
      params: { color: parseColor(colorStr || '') },
      raw: text,
    };
  }

  // Roughness commands
  const roughMatch = normalized.match(/(?:roughness|rough)\s+(?:to\s+)?([0-1](?:\.\d+)?)/);
  if (roughMatch) {
    return {
      type: 'material',
      action: 'setRoughness',
      target,
      params: { value: parseFloat(roughMatch[1]) },
      raw: text,
    };
  }

  // Metalness commands
  const metalMatch = normalized.match(/(?:metal(?:ness)?|metallic)\s+(?:to\s+)?([0-1](?:\.\d+)?)/);
  if (metalMatch) {
    return {
      type: 'material',
      action: 'setMetalness',
      target,
      params: { value: parseFloat(metalMatch[1]) },
      raw: text,
    };
  }

  // Transform commands

  // Position/Move commands
  const posMatch = normalized.match(/(?:position|move|place)\s+(?:to\s+)?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
  if (posMatch) {
    return {
      type: 'transform',
      action: 'setPosition',
      target,
      params: {
        x: parseFloat(posMatch[1]),
        y: parseFloat(posMatch[2]),
        z: parseFloat(posMatch[3]),
      },
      raw: text,
    };
  }

  // Rotation commands
  const rotMatch = normalized.match(/rotate\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s*(deg|degree|degrees))?/);
  if (rotMatch) {
    let x = parseFloat(rotMatch[1]);
    let y = parseFloat(rotMatch[2]);
    let z = parseFloat(rotMatch[3]);
    const unit = rotMatch[4];

    // Convert degrees to radians if specified
    if (unit) {
      const toRad = (v: number) => (v * Math.PI) / 180;
      x = toRad(x);
      y = toRad(y);
      z = toRad(z);
    }

    return {
      type: 'transform',
      action: 'setRotation',
      target,
      params: { x, y, z },
      raw: text,
    };
  }

  // Scale commands
  const scaleMatch = normalized.match(/scale\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
  if (scaleMatch) {
    return {
      type: 'transform',
      action: 'setScale',
      target,
      params: {
        x: parseFloat(scaleMatch[1]),
        y: parseFloat(scaleMatch[2]),
        z: parseFloat(scaleMatch[3]),
      },
      raw: text,
    };
  }

  // Uniform scale
  const uniformScaleMatch = normalized.match(/scale\s+(?:to\s+)?(-?\d+(?:\.\d+)?)/);
  if (uniformScaleMatch) {
    const s = parseFloat(uniformScaleMatch[1]);
    return {
      type: 'transform',
      action: 'setScale',
      target,
      params: { x: s, y: s, z: s },
      raw: text,
    };
  }

  return {
    type: 'unknown',
    raw: text,
  };
}

/**
 * Parse color string to hex number
 */
function parseColor(colorStr: string): number {
  // Named colors
  const namedColors: Record<string, number> = {
    red: 0xff0000,
    green: 0x00ff00,
    blue: 0x0000ff,
    yellow: 0xffff00,
    purple: 0x800080,
    pink: 0xff69b4,
    white: 0xffffff,
    black: 0x000000,
    orange: 0xffa500,
    cyan: 0x00ffff,
    magenta: 0xff00ff,
    gray: 0x808080,
    grey: 0x808080,
  };

  if (colorStr.startsWith('#')) {
    return parseInt(colorStr.slice(1), 16);
  }

  return namedColors[colorStr] || 0x3399e6; // Default: cyan-blue
}

/**
 * Generate command suggestions based on available objects
 */
export function generateCommandSuggestions(objectNames: string[]): string[] {
  const suggestions: string[] = [];

  if (objectNames.length > 0) {
    const firstObj = objectNames[0];
    suggestions.push(
      `select ${firstObj}`,
      `make ${firstObj} red`,
      `move ${firstObj} to 0 5 0`,
      `rotate ${firstObj} 45 0 0 degrees`
    );
  }

  suggestions.push(
    'make it blue',
    'set roughness to 0.8',
    'set metalness to 0.5',
    'scale to 2'
  );

  return suggestions;
}
