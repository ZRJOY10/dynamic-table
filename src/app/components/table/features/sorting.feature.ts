import { signal, computed, WritableSignal } from '@angular/core';
import { ColumnConfig, SortConfig, SortDirection, SortChangeEvent } from '../table.types';

export interface SortingState {
  sorts: WritableSignal<SortConfig[]>;
}

export interface SortingDeps<T> {
  columns: () => ColumnConfig<T>[];
  enableMultiSort: () => boolean;
  onSortChange: (event: SortChangeEvent) => void;
}

/**
 * Creates sorting state signals
 */
export function createSortingState(): SortingState {
  return {
    sorts: signal<SortConfig[]>([]),
  };
}

/**
 * Handles header click for sorting
 */
export function handleHeaderClick<T>(
  column: ColumnConfig<T>,
  event: MouseEvent,
  state: SortingState,
  deps: SortingDeps<T>
): void {
  if (!column.sortable) return;

  const currentSorts = [...state.sorts()];
  const existingIndex = currentSorts.findIndex((s) => s.key === column.key);

  if (deps.enableMultiSort() && event.shiftKey) {
    // Multi-sort with Shift key
    if (existingIndex >= 0) {
      const existing = currentSorts[existingIndex];
      if (existing.direction === 'asc') {
        existing.direction = 'desc';
      } else if (existing.direction === 'desc') {
        currentSorts.splice(existingIndex, 1);
        // Reorder remaining sorts
        currentSorts.forEach((s, i) => (s.order = i + 1));
      }
    } else {
      currentSorts.push({
        key: column.key,
        direction: 'asc',
        order: currentSorts.length + 1,
      });
    }
  } else {
    // Single sort
    if (existingIndex >= 0 && currentSorts.length === 1) {
      const existing = currentSorts[0];
      if (existing.direction === 'asc') {
        existing.direction = 'desc';
      } else {
        currentSorts.splice(0, 1);
      }
    } else {
      currentSorts.length = 0;
      currentSorts.push({ key: column.key, direction: 'asc', order: 1 });
    }
  }

  state.sorts.set(currentSorts);
  deps.onSortChange({ sorts: currentSorts });
}

/**
 * Gets the sort direction for a column
 */
export function getSortDirection(key: string, state: SortingState): SortDirection {
  return state.sorts().find((s) => s.key === key)?.direction || null;
}

/**
 * Gets the sort order number for multi-sort display
 */
export function getSortOrder(key: string, state: SortingState): number | null {
  const sort = state.sorts().find((s) => s.key === key);
  return sort && state.sorts().length > 1 ? sort.order : null;
}

/**
 * Applies sorting to data
 */
export function applySorting<T>(
  data: T[],
  state: SortingState,
  columns: ColumnConfig<T>[],
  defaultCompare: (a: any, b: any) => number
): T[] {
  const activeSorts = state.sorts();
  if (activeSorts.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of activeSorts.sort((x, y) => x.order - y.order)) {
      const column = columns.find((c) => c.key === sort.key);
      let comparison = 0;

      if (column?.sortComparator) {
        comparison = column.sortComparator(a as T, b as T, sort.direction);
      } else {
        comparison = defaultCompare((a as any)[sort.key], (b as any)[sort.key]);
      }

      if (sort.direction === 'desc') comparison *= -1;
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

/**
 * Resets all sorting
 */
export function resetSorting(state: SortingState, deps: Pick<SortingDeps<any>, 'onSortChange'>): void {
  state.sorts.set([]);
  deps.onSortChange({ sorts: [] });
}
