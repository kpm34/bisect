/**
 * Variable Runtime System
 *
 * Handles variable actions and condition evaluation for the scene variables system.
 * Provides a comprehensive set of operations for state-driven scene interactions.
 */

import { SceneVariable, SceneVariableType } from '../r3f/SceneSelectionContext';

// ============== VARIABLE ACTIONS ==============

export type VariableAction =
  | 'set'           // Set to specific value
  | 'toggle'        // Flip boolean
  | 'increment'     // Add to number
  | 'decrement'     // Subtract from number
  | 'multiply'      // Multiply number
  | 'divide'        // Divide number
  | 'append'        // Add to string
  | 'prepend'       // Add before string
  | 'reset'         // Reset to default value
  | 'clamp';        // Clamp number to min/max

export interface VariableActionConfig {
  action: VariableAction;
  variableId: string;
  value?: boolean | number | string;  // For set, increment, decrement, multiply, divide, append, prepend
  min?: number;                       // For clamp
  max?: number;                       // For clamp
}

/**
 * Execute a variable action and return the new value
 */
export function executeVariableAction(
  variable: SceneVariable,
  config: VariableActionConfig
): boolean | number | string {
  const { action, value, min, max } = config;

  switch (action) {
    case 'set':
      if (value === undefined) return variable.value;
      return coerceValue(value, variable.type);

    case 'toggle':
      if (variable.type !== 'boolean') {
        console.warn(`Cannot toggle non-boolean variable: ${variable.name}`);
        return variable.value;
      }
      return !variable.value;

    case 'increment':
      if (variable.type !== 'number') {
        console.warn(`Cannot increment non-number variable: ${variable.name}`);
        return variable.value;
      }
      return (variable.value as number) + (typeof value === 'number' ? value : 1);

    case 'decrement':
      if (variable.type !== 'number') {
        console.warn(`Cannot decrement non-number variable: ${variable.name}`);
        return variable.value;
      }
      return (variable.value as number) - (typeof value === 'number' ? value : 1);

    case 'multiply':
      if (variable.type !== 'number') {
        console.warn(`Cannot multiply non-number variable: ${variable.name}`);
        return variable.value;
      }
      return (variable.value as number) * (typeof value === 'number' ? value : 1);

    case 'divide':
      if (variable.type !== 'number') {
        console.warn(`Cannot divide non-number variable: ${variable.name}`);
        return variable.value;
      }
      const divisor = typeof value === 'number' ? value : 1;
      if (divisor === 0) {
        console.warn(`Cannot divide by zero for variable: ${variable.name}`);
        return variable.value;
      }
      return (variable.value as number) / divisor;

    case 'append':
      if (variable.type !== 'string') {
        console.warn(`Cannot append to non-string variable: ${variable.name}`);
        return variable.value;
      }
      return (variable.value as string) + String(value ?? '');

    case 'prepend':
      if (variable.type !== 'string') {
        console.warn(`Cannot prepend to non-string variable: ${variable.name}`);
        return variable.value;
      }
      return String(value ?? '') + (variable.value as string);

    case 'reset':
      return variable.defaultValue;

    case 'clamp':
      if (variable.type !== 'number') {
        console.warn(`Cannot clamp non-number variable: ${variable.name}`);
        return variable.value;
      }
      const numValue = variable.value as number;
      const minVal = min ?? -Infinity;
      const maxVal = max ?? Infinity;
      return Math.min(Math.max(numValue, minVal), maxVal);

    default:
      console.warn(`Unknown action: ${action}`);
      return variable.value;
  }
}

// ============== CONDITION OPERATORS ==============

export type ConditionOperator =
  // Comparison
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  // String operations
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'matches'        // Regex match
  // Boolean shortcuts
  | 'isTrue'
  | 'isFalse'
  // Null/empty checks
  | 'isEmpty'
  | 'isNotEmpty'
  // Range check
  | 'between';

export interface Condition {
  variable: string;  // Variable name or ID
  operator: ConditionOperator;
  compareValue?: boolean | number | string;
  compareValue2?: number;  // For 'between' operator
}

export interface ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (Condition | ConditionGroup)[];
}

/**
 * Evaluate a single condition against a variable
 */
export function evaluateCondition(
  condition: Condition,
  variables: SceneVariable[]
): boolean {
  const variable = variables.find(
    v => v.id === condition.variable || v.name === condition.variable
  );

  if (!variable) {
    console.warn(`Variable not found: ${condition.variable}`);
    return false;
  }

  const value = variable.value;
  const compareValue = condition.compareValue;

  switch (condition.operator) {
    // Comparison operators
    case 'equals':
      return value === compareValue;
    case 'notEquals':
      return value !== compareValue;
    case 'greaterThan':
      return typeof value === 'number' && typeof compareValue === 'number' && value > compareValue;
    case 'lessThan':
      return typeof value === 'number' && typeof compareValue === 'number' && value < compareValue;
    case 'greaterOrEqual':
      return typeof value === 'number' && typeof compareValue === 'number' && value >= compareValue;
    case 'lessOrEqual':
      return typeof value === 'number' && typeof compareValue === 'number' && value <= compareValue;

    // String operations
    case 'contains':
      return typeof value === 'string' && typeof compareValue === 'string' && value.includes(compareValue);
    case 'notContains':
      return typeof value === 'string' && typeof compareValue === 'string' && !value.includes(compareValue);
    case 'startsWith':
      return typeof value === 'string' && typeof compareValue === 'string' && value.startsWith(compareValue);
    case 'endsWith':
      return typeof value === 'string' && typeof compareValue === 'string' && value.endsWith(compareValue);
    case 'matches':
      if (typeof value !== 'string' || typeof compareValue !== 'string') return false;
      try {
        return new RegExp(compareValue).test(value);
      } catch {
        return false;
      }

    // Boolean shortcuts
    case 'isTrue':
      return value === true;
    case 'isFalse':
      return value === false;

    // Null/empty checks
    case 'isEmpty':
      if (typeof value === 'string') return value === '';
      if (typeof value === 'number') return value === 0;
      if (typeof value === 'boolean') return value === false;
      return false;
    case 'isNotEmpty':
      if (typeof value === 'string') return value !== '';
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'boolean') return value === true;
      return true;

    // Range check
    case 'between':
      if (typeof value !== 'number') return false;
      const min = typeof compareValue === 'number' ? compareValue : 0;
      const max = typeof condition.compareValue2 === 'number' ? condition.compareValue2 : Infinity;
      return value >= min && value <= max;

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluate a condition group (with AND/OR logic)
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  variables: SceneVariable[]
): boolean {
  if (group.conditions.length === 0) return true;

  const results = group.conditions.map(conditionOrGroup => {
    if ('logic' in conditionOrGroup) {
      // It's a nested ConditionGroup
      return evaluateConditionGroup(conditionOrGroup, variables);
    } else {
      // It's a Condition
      return evaluateCondition(conditionOrGroup, variables);
    }
  });

  if (group.logic === 'AND') {
    return results.every(Boolean);
  } else {
    return results.some(Boolean);
  }
}

/**
 * Evaluate either a single condition or a condition group
 */
export function evaluateConditions(
  conditionOrGroup: Condition | ConditionGroup | undefined,
  variables: SceneVariable[]
): boolean {
  if (!conditionOrGroup) return true;

  if ('logic' in conditionOrGroup) {
    return evaluateConditionGroup(conditionOrGroup, variables);
  }
  return evaluateCondition(conditionOrGroup, variables);
}

// ============== UTILITY FUNCTIONS ==============

/**
 * Get available operators for a variable type
 */
export function getOperatorsForType(type: SceneVariableType): ConditionOperator[] {
  switch (type) {
    case 'boolean':
      return ['equals', 'notEquals', 'isTrue', 'isFalse'];
    case 'number':
      return [
        'equals', 'notEquals',
        'greaterThan', 'lessThan', 'greaterOrEqual', 'lessOrEqual',
        'between', 'isEmpty', 'isNotEmpty'
      ];
    case 'string':
      return [
        'equals', 'notEquals',
        'contains', 'notContains', 'startsWith', 'endsWith', 'matches',
        'isEmpty', 'isNotEmpty'
      ];
    default:
      return ['equals', 'notEquals'];
  }
}

/**
 * Get available actions for a variable type
 */
export function getActionsForType(type: SceneVariableType): VariableAction[] {
  switch (type) {
    case 'boolean':
      return ['set', 'toggle', 'reset'];
    case 'number':
      return ['set', 'increment', 'decrement', 'multiply', 'divide', 'clamp', 'reset'];
    case 'string':
      return ['set', 'append', 'prepend', 'reset'];
    default:
      return ['set', 'reset'];
  }
}

/**
 * Coerce a value to the correct type
 */
export function coerceValue(value: any, type: SceneVariableType): boolean | number | string {
  switch (type) {
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return Boolean(value);
    case 'number':
      if (typeof value === 'number') return value;
      const num = parseFloat(String(value));
      return isNaN(num) ? 0 : num;
    case 'string':
      return String(value);
    default:
      return String(value);
  }
}

/**
 * Get a human-readable label for an operator
 */
export function getOperatorLabel(operator: ConditionOperator): string {
  const labels: Record<ConditionOperator, string> = {
    equals: 'equals',
    notEquals: 'not equals',
    greaterThan: '>',
    lessThan: '<',
    greaterOrEqual: '>=',
    lessOrEqual: '<=',
    contains: 'contains',
    notContains: 'does not contain',
    startsWith: 'starts with',
    endsWith: 'ends with',
    matches: 'matches regex',
    isTrue: 'is true',
    isFalse: 'is false',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    between: 'is between',
  };
  return labels[operator] || operator;
}

/**
 * Get a human-readable label for an action
 */
export function getActionLabel(action: VariableAction): string {
  const labels: Record<VariableAction, string> = {
    set: 'Set to',
    toggle: 'Toggle',
    increment: 'Increment by',
    decrement: 'Decrement by',
    multiply: 'Multiply by',
    divide: 'Divide by',
    append: 'Append',
    prepend: 'Prepend',
    reset: 'Reset to default',
    clamp: 'Clamp to range',
  };
  return labels[action] || action;
}
