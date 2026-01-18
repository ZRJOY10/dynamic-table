import { signal, WritableSignal } from '@angular/core';
import { ColumnConfig, ColumnReorderEvent } from '../table.types';

export interface ColumnReorderState {
  columnOrder: WritableSignal<string[]>;
  draggedColumn: WritableSignal<string | null>;
  dropTargetColumn: WritableSignal<string | null>;
}

export interface ColumnReorderDeps<T> {
  enableColumnReorder: () => boolean;
  processedColumns: () => ColumnConfig<T>[];
  onColumnReorder: (event: ColumnReorderEvent) => void;
}

/**
 * Creates column reorder state signals
 */
export function createColumnReorderState(): ColumnReorderState {
  return {
    columnOrder: signal<string[]>([]),
    draggedColumn: signal<string | null>(null),
    dropTargetColumn: signal<string | null>(null),
  };
}

/**
 * Initializes column order from columns
 */
export function initializeColumnOrder<T>(
  columns: ColumnConfig<T>[],
  state: ColumnReorderState
): void {
  if (state.columnOrder().length === 0 && columns.length > 0) {
    const sortedKeys = [...columns]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.key);
    state.columnOrder.set(sortedKeys);
  }
}

/**
 * Starts column drag operation
 */
export function startDrag<T>(
  column: ColumnConfig<T>,
  event: DragEvent,
  state: ColumnReorderState,
  deps: ColumnReorderDeps<T>
): void {
  if (!deps.enableColumnReorder() || column.frozen) return;

  state.draggedColumn.set(column.key);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', column.key);
  }
}

/**
 * Handles drag over event
 */
export function handleDragOver<T>(
  column: ColumnConfig<T>,
  event: DragEvent,
  state: ColumnReorderState,
  deps: ColumnReorderDeps<T>
): void {
  if (!deps.enableColumnReorder() || column.frozen) return;
  event.preventDefault();

  const dragged = state.draggedColumn();
  if (dragged && dragged !== column.key) {
    state.dropTargetColumn.set(column.key);
  }
}

/**
 * Handles drag leave event
 */
export function handleDragLeave(state: ColumnReorderState): void {
  state.dropTargetColumn.set(null);
}

/**
 * Handles drop event
 */
export function handleDrop<T>(
  column: ColumnConfig<T>,
  event: DragEvent,
  state: ColumnReorderState,
  deps: ColumnReorderDeps<T>
): void {
  event.preventDefault();
  const dragged = state.draggedColumn();
  if (!dragged || dragged === column.key || column.frozen) return;

  const order = [...state.columnOrder()];
  const fromIndex = order.indexOf(dragged);
  const toIndex = order.indexOf(column.key);

  if (fromIndex >= 0 && toIndex >= 0) {
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, dragged);
    state.columnOrder.set(order);

    deps.onColumnReorder({
      columns: deps.processedColumns(),
      movedColumn: dragged,
      fromIndex,
      toIndex,
    });
  }

  state.draggedColumn.set(null);
  state.dropTargetColumn.set(null);
}

/**
 * Handles drag end event
 */
export function handleDragEnd(state: ColumnReorderState): void {
  state.draggedColumn.set(null);
  state.dropTargetColumn.set(null);
}

/**
 * Applies custom order to columns
 */
export function applyColumnOrder<T>(
  columns: ColumnConfig<T>[],
  state: ColumnReorderState
): ColumnConfig<T>[] {
  const order = state.columnOrder();
  if (order.length === 0) {
    return [...columns].sort((a, b) => a.order - b.order);
  }

  return [...columns].sort((a, b) => {
    const aIndex = order.indexOf(a.key);
    const bIndex = order.indexOf(b.key);
    if (aIndex === -1 && bIndex === -1) return a.order - b.order;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

/**
 * Checks if a column is being dragged
 */
export function isDragging(state: ColumnReorderState): boolean {
  return state.draggedColumn() !== null;
}

/**
 * Checks if a column is the drop target
 */
export function isDropTarget(key: string, state: ColumnReorderState): boolean {
  return state.dropTargetColumn() === key;
}
