import type {
  WorkflowCondition,
  ConditionGroup,
} from '../types';
import {
  ConditionOperator,
  LogicalOperator,
} from '../types';

export class ConditionEvaluator {
  evaluate(condition: WorkflowCondition, context: Record<string, unknown>): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const { operator, value } = condition;

    switch (operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== value;
      case ConditionOperator.CONTAINS:
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case ConditionOperator.STARTS_WITH:
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      case ConditionOperator.ENDS_WITH:
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(value);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(value);
      case ConditionOperator.BETWEEN:
        if (Array.isArray(value) && value.length === 2) {
          return Number(fieldValue) >= Number(value[0]) && Number(fieldValue) <= Number(value[1]);
        }
        return false;
      case ConditionOperator.IS_EMPTY:
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case ConditionOperator.IS_NOT_EMPTY:
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case ConditionOperator.INCLUDES:
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        return String(fieldValue)
          .split(',')
          .map((v) => v.trim())
          .includes(String(value));
      case ConditionOperator.NOT_INCLUDES:
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(value);
        }
        return !String(fieldValue)
          .split(',')
          .map((v) => v.trim())
          .includes(String(value));
      default:
        return false;
    }
  }

  evaluateGroup(group: ConditionGroup, context: Record<string, unknown>): boolean {
    if (group.conditions.length === 0) return true;

    const results = group.conditions.map((condition) => this.evaluate(condition, context));

    if (group.logicalOperator === LogicalOperator.AND) {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private getFieldValue(field: string, context: Record<string, unknown>): unknown {
    const parts = field.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}
