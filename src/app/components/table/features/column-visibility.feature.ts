import { signal, WritableSignal } from '@angular/core';

// ============================================================================
// Types
// ============================================================================
export interface ColumnVisibilityState {
  hiddenColumns: WritableSignal<Set<string>>;
  dropdownOpen: WritableSignal<boolean>;
}

// ============================================================================
// State Factory
// ============================================================================
export function createColumnVisibilityState(): ColumnVisibilityState {
  return {
    hiddenColumns: signal(new Set<string>()),
    dropdownOpen: signal(false),
  };
}

// ============================================================================
// Functions
// ============================================================================
export function toggleDropdown(state: ColumnVisibilityState): void {
  state.dropdownOpen.update((open) => !open);
}

export function closeDropdown(state: ColumnVisibilityState): void {
  state.dropdownOpen.set(false);
}

export function toggleColumnVisibility(
  state: ColumnVisibilityState,
  columnKey: string
): void {
  state.hiddenColumns.update((hidden) => {
    const newHidden = new Set(hidden);
    if (newHidden.has(columnKey)) {
      newHidden.delete(columnKey);
    } else {
      newHidden.add(columnKey);
    }
    return newHidden;
  });
}

export function isColumnVisible(
  state: ColumnVisibilityState,
  columnKey: string
): boolean {
  return !state.hiddenColumns().has(columnKey);
}

export function showAllColumns(state: ColumnVisibilityState): void {
  state.hiddenColumns.set(new Set());
}

export function hideAllColumns(
  state: ColumnVisibilityState,
  columnKeys: string[]
): void {
  state.hiddenColumns.set(new Set(columnKeys));
}

export function getVisibleColumnCount(
  state: ColumnVisibilityState,
  totalColumns: number
): number {
  return totalColumns - state.hiddenColumns().size;
}
