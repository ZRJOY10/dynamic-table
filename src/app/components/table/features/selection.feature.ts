import { signal, computed, WritableSignal, Signal } from '@angular/core';
import { TableConfig, RowSelectionEvent } from '../table.types';

export interface SelectionState {
  selectedRows: WritableSignal<Set<any>>;
}

export interface SelectionDeps<T> {
  data: () => T[];
  paginatedData: () => T[];
  config: () => TableConfig;
  onSelectionChange: (event: RowSelectionEvent<T>) => void;
}

/**
 * Creates selection state signals
 */
export function createSelectionState(): SelectionState {
  return {
    selectedRows: signal<Set<any>>(new Set()),
  };
}

/**
 * Toggles selection for a single row
 */
export function toggleRowSelection<T>(
  row: T,
  state: SelectionState,
  deps: SelectionDeps<T>
): void {
  const config = deps.config();
  if (!config.enableRowSelection) return;

  const keyField = config.rowKeyField || 'id';
  const key = (row as any)[keyField];
  const selected = new Set(state.selectedRows());

  if (config.selectionMode === 'single') {
    if (selected.has(key)) {
      selected.clear();
    } else {
      selected.clear();
      selected.add(key);
    }
  } else {
    if (selected.has(key)) {
      selected.delete(key);
    } else {
      selected.add(key);
    }
  }

  state.selectedRows.set(selected);
  emitSelectionChange(row, selected.has(key), state, deps);
}

/**
 * Toggles selection for all rows on current page
 */
export function toggleAllSelection<T>(
  allSelected: boolean,
  state: SelectionState,
  deps: SelectionDeps<T>
): void {
  const config = deps.config();
  const keyField = config.rowKeyField || 'id';
  const data = deps.paginatedData();
  const selected = new Set(state.selectedRows());

  if (allSelected) {
    data.forEach((row) => selected.delete((row as any)[keyField]));
  } else {
    data.forEach((row) => selected.add((row as any)[keyField]));
  }

  state.selectedRows.set(selected);
  emitSelectionChange(undefined, !allSelected, state, deps);
}

/**
 * Checks if a row is selected
 */
export function isRowSelected<T>(row: T, state: SelectionState, config: TableConfig): boolean {
  const keyField = config.rowKeyField || 'id';
  return state.selectedRows().has((row as any)[keyField]);
}

/**
 * Checks if all rows on current page are selected
 */
export function computeAllSelected<T>(
  paginatedData: T[],
  selectedRows: Set<any>,
  keyField: string
): boolean {
  return paginatedData.length > 0 && paginatedData.every((row) => selectedRows.has((row as any)[keyField]));
}

/**
 * Checks if some (but not all) rows on current page are selected
 */
export function computeSomeSelected<T>(
  paginatedData: T[],
  selectedRows: Set<any>,
  keyField: string
): boolean {
  const selectedCount = paginatedData.filter((row) => selectedRows.has((row as any)[keyField])).length;
  return selectedCount > 0 && selectedCount < paginatedData.length;
}

/**
 * Gets all selected rows
 */
export function getSelectedRows<T>(state: SelectionState, deps: SelectionDeps<T>): T[] {
  const keyField = deps.config().rowKeyField || 'id';
  return deps.data().filter((r) => state.selectedRows().has((r as any)[keyField]));
}

/**
 * Clears all selections
 */
export function clearSelection<T>(state: SelectionState, deps: Pick<SelectionDeps<T>, 'onSelectionChange'>): void {
  state.selectedRows.set(new Set());
  deps.onSelectionChange({ selected: [], isSelected: false });
}

/**
 * Emits selection change event
 */
function emitSelectionChange<T>(
  row: T | undefined,
  isSelected: boolean,
  state: SelectionState,
  deps: SelectionDeps<T>
): void {
  const keyField = deps.config().rowKeyField || 'id';
  const selectedData = deps.data().filter((r) => state.selectedRows().has((r as any)[keyField]));
  deps.onSelectionChange({ selected: selectedData, row, isSelected });
}
