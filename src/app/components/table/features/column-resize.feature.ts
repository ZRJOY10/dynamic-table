import { signal, WritableSignal } from '@angular/core';
import { ColumnConfig, ColumnResizeEvent } from '../table.types';

export interface ColumnResizeState {
  columnWidths: WritableSignal<Map<string, number>>;
  resizingColumn: WritableSignal<string | null>;
  resizeStartX: WritableSignal<number>;
  resizeStartWidth: WritableSignal<number>;
}

export interface ColumnResizeDeps<T> {
  processedColumns: () => ColumnConfig<T>[];
  onColumnResize: (event: ColumnResizeEvent) => void;
}

/**
 * Creates column resize state signals
 */
export function createColumnResizeState(): ColumnResizeState {
  return {
    columnWidths: signal<Map<string, number>>(new Map()),
    resizingColumn: signal<string | null>(null),
    resizeStartX: signal(0),
    resizeStartWidth: signal(0),
  };
}

/**
 * Starts column resize operation
 */
export function startResize<T>(
  column: ColumnConfig<T>,
  event: MouseEvent,
  state: ColumnResizeState
): void {
  if (!column.resizable) return;
  
  event.preventDefault();
  event.stopPropagation();

  state.resizingColumn.set(column.key);
  state.resizeStartX.set(event.clientX);
  state.resizeStartWidth.set(column.width || 150);
}

/**
 * Handles mouse move during resize
 */
export function handleResizeMove<T>(
  event: MouseEvent,
  state: ColumnResizeState,
  deps: ColumnResizeDeps<T>
): void {
  const resizing = state.resizingColumn();
  if (!resizing) return;

  const column = deps.processedColumns().find((c) => c.key === resizing);
  if (!column) return;

  const diff = event.clientX - state.resizeStartX();
  let newWidth = state.resizeStartWidth() + diff;

  // Apply min/max constraints
  newWidth = Math.max(column.minWidth || 50, newWidth);
  newWidth = Math.min(column.maxWidth || 500, newWidth);

  const widths = new Map(state.columnWidths());
  widths.set(resizing, newWidth);
  state.columnWidths.set(widths);
}

/**
 * Ends column resize operation
 */
export function endResize<T>(
  state: ColumnResizeState,
  deps: ColumnResizeDeps<T>
): void {
  const resizing = state.resizingColumn();
  if (resizing) {
    const width = state.columnWidths().get(resizing);
    if (width) {
      deps.onColumnResize({ column: resizing, width });
    }
    state.resizingColumn.set(null);
  }
}

/**
 * Checks if currently resizing
 */
export function isResizing(state: ColumnResizeState): boolean {
  return state.resizingColumn() !== null;
}

/**
 * Gets the current width for a column
 */
export function getColumnWidth(key: string, state: ColumnResizeState, defaultWidth: number = 150): number {
  return state.columnWidths().get(key) ?? defaultWidth;
}

/**
 * Applies custom widths to columns
 */
export function applyCustomWidths<T>(
  columns: ColumnConfig<T>[],
  state: ColumnResizeState
): ColumnConfig<T>[] {
  const widths = state.columnWidths();
  return columns.map((col) => ({
    ...col,
    width: widths.has(col.key) ? widths.get(col.key) : col.width,
  }));
}
