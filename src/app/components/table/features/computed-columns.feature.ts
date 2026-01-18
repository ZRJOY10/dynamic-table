import { signal, WritableSignal } from '@angular/core';
import { ColumnConfig } from '../table.types';

// ============================================================================
// Types
// ============================================================================
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty';

export interface ColumnCondition {
  id: string;
  sourceColumn: string;
  operator: ConditionOperator;
  compareValue: string;
  thenValue: string;
  elseValue: string;
}

export interface ComputedColumnDefinition {
  key: string;
  title: string;
  conditions: ColumnCondition[];
  defaultValue: string;
}

export interface ComputedColumnsState {
  computedColumns: WritableSignal<ComputedColumnDefinition[]>;
  modalOpen: WritableSignal<boolean>;
  editingColumn: WritableSignal<ComputedColumnDefinition | null>;
}

// ============================================================================
// State Factory
// ============================================================================
export function createComputedColumnsState(): ComputedColumnsState {
  return {
    computedColumns: signal([]),
    modalOpen: signal(false),
    editingColumn: signal(null),
  };
}

// ============================================================================
// Modal Functions
// ============================================================================
export function openComputedColumnModal(
  state: ComputedColumnsState,
  editColumn?: ComputedColumnDefinition
): void {
  state.editingColumn.set(editColumn || null);
  state.modalOpen.set(true);
}

export function closeComputedColumnModal(state: ComputedColumnsState): void {
  state.modalOpen.set(false);
  state.editingColumn.set(null);
}

// ============================================================================
// Column Management Functions
// ============================================================================
export function generateColumnKey(): string {
  return `computed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConditionId(): string {
  return `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyCondition(): ColumnCondition {
  return {
    id: generateConditionId(),
    sourceColumn: '',
    operator: 'equals',
    compareValue: '',
    thenValue: '',
    elseValue: '',
  };
}

export function createEmptyComputedColumn(): ComputedColumnDefinition {
  return {
    key: generateColumnKey(),
    title: '',
    conditions: [createEmptyCondition()],
    defaultValue: '',
  };
}

export function addComputedColumn(
  state: ComputedColumnsState,
  column: ComputedColumnDefinition
): void {
  state.computedColumns.update((cols) => [...cols, column]);
}

export function updateComputedColumn(
  state: ComputedColumnsState,
  column: ComputedColumnDefinition
): void {
  state.computedColumns.update((cols) =>
    cols.map((c) => (c.key === column.key ? column : c))
  );
}

export function removeComputedColumn(
  state: ComputedColumnsState,
  columnKey: string
): void {
  state.computedColumns.update((cols) => cols.filter((c) => c.key !== columnKey));
}

// ============================================================================
// Condition Evaluation
// ============================================================================
export function evaluateCondition<T extends Record<string, any>>(
  row: T,
  condition: ColumnCondition
): boolean {
  const sourceValue = row[condition.sourceColumn];
  const compareValue = condition.compareValue;

  switch (condition.operator) {
    case 'equals':
      return String(sourceValue).toLowerCase() === String(compareValue).toLowerCase();
    case 'notEquals':
      return String(sourceValue).toLowerCase() !== String(compareValue).toLowerCase();
    case 'contains':
      return String(sourceValue).toLowerCase().includes(String(compareValue).toLowerCase());
    case 'notContains':
      return !String(sourceValue).toLowerCase().includes(String(compareValue).toLowerCase());
    case 'greaterThan':
      return Number(sourceValue) > Number(compareValue);
    case 'lessThan':
      return Number(sourceValue) < Number(compareValue);
    case 'greaterThanOrEqual':
      return Number(sourceValue) >= Number(compareValue);
    case 'lessThanOrEqual':
      return Number(sourceValue) <= Number(compareValue);
    case 'isEmpty':
      return sourceValue === null || sourceValue === undefined || sourceValue === '';
    case 'isNotEmpty':
      return sourceValue !== null && sourceValue !== undefined && sourceValue !== '';
    default:
      return false;
  }
}

export function computeColumnValue<T extends Record<string, any>>(
  row: T,
  columnDef: ComputedColumnDefinition
): string {
  for (const condition of columnDef.conditions) {
    if (evaluateCondition(row, condition)) {
      return condition.thenValue;
    }
  }
  return columnDef.defaultValue || columnDef.conditions[0]?.elseValue || '';
}

export function computedColumnToColumnConfig<T extends Record<string, any>>(
  computedCol: ComputedColumnDefinition,
  order: number
): ColumnConfig<T> {
  return {
    key: computedCol.key as keyof T & string,
    title: computedCol.title,
    order,
    width: 150,
    sortable: true,
    filterable: true,
    resizable: true,
    cellType: 'text',
    isComputed: true,
  };
}

// ============================================================================
// Operators List
// ============================================================================
export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
];
