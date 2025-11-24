/**
 * Edit Helpers
 *
 * Shared utilities for applying edit deltas to scene objects.
 * Used by both useSceneSession and useSceneHistory to avoid code duplication.
 */

import type { UniversalEditor } from '@/lib/core/adapters';
import type { EditDelta } from '@/lib/persistence/types';

/**
 * Apply an edit delta to a scene object
 *
 * @param editor - The scene editor instance
 * @param delta - The edit delta to apply
 * @param isUndo - If true, use oldValue instead of newValue (for undo operations)
 * @returns True if the edit was applied successfully
 */
export async function applyEditDelta(
  editor: UniversalEditor,
  delta: EditDelta,
  isUndo: boolean = false
): Promise<boolean> {
  if (!editor) return false;

  try {
    const object = editor.findObjectById(delta.objectId);
    if (!object) {
      console.warn('Object not found for edit:', delta);
      return false;
    }

    // Use oldValue for undo, newValue for redo/normal apply
    const value = isUndo ? delta.oldValue : delta.newValue;

    // Apply the edit based on property type
    switch (delta.property) {
      case 'position':
        if (Array.isArray(value) && value.length === 3) {
          editor.setPosition(object.name, value[0], value[1], value[2]);
        }
        break;

      case 'rotation':
        if (Array.isArray(value) && value.length === 3) {
          editor.setRotation(object.name, value[0], value[1], value[2]);
        }
        break;

      case 'scale':
        if (Array.isArray(value) && value.length === 3) {
          editor.setScale(object.name, value[0], value[1], value[2]);
        }
        break;

      case 'color':
        if (typeof value === 'number') {
          editor.setColor(object.name, value);
        }
        break;

      case 'roughness':
        if (typeof value === 'number') {
          editor.setRoughness(object.name, value);
        }
        break;

      case 'metalness':
        if (typeof value === 'number') {
          editor.setMetalness(object.name, value);
        }
        break;

      case 'visible':
        if (typeof value === 'boolean') {
          editor.setVisible(object.name, value);
        }
        break;

      default:
        console.warn('Unknown property type:', delta.property);
        return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to apply edit delta:', error);
    return false;
  }
}

