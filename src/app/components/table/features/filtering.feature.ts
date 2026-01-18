import { signal, WritableSignal } from '@angular/core';
import { ColumnConfig, FilterConfig, FilterOperator, FilterChangeEvent } from '../table.types';

export interface FilteringState {
  filters: WritableSignal<FilterConfig[]>;
  filterInputs: WritableSignal<Map<string, string>>;
}

export interface FilteringDeps {
  onFilterChange: (event: FilterChangeEvent) => void;
}

/**
 * Creates filtering state signals
 */
export function createFilteringState(): FilteringState {
  return {
    filters: signal<FilterConfig[]>([]),
    filterInputs: signal<Map<string, string>>(new Map()),
  };
}

/**
 * Gets the default filter operator based on filter type
 */
export function getDefaultOperator(filterType: string): FilterOperator {
  switch (filterType) {
    case 'number':
      return 'equals';
    case 'date':
      return 'equals';
    case 'boolean':
      return 'equals';
    default:
      return 'contains';
  }
}

/**
 * Handles filter input change
 */
export function handleFilterInput<T>(
  column: ColumnConfig<T>,
  value: string,
  state: FilteringState,
  deps: FilteringDeps
): void {
  const inputs = new Map(state.filterInputs());
  inputs.set(column.key, value);
  state.filterInputs.set(inputs);

  const currentFilters = state.filters().filter((f) => f.key !== column.key);

  if (value.trim()) {
    currentFilters.push({
      key: column.key,
      value: value.trim(),
      operator: getDefaultOperator(column.filterType || 'text'),
    });
  }

  state.filters.set(currentFilters);
  deps.onFilterChange({ filters: currentFilters });
}

/**
 * Gets the current filter value for a column
 */
export function getFilterValue(key: string, state: FilteringState): string {
  return state.filterInputs().get(key) || '';
}

/**
 * Clears a single column filter
 */
export function clearFilter(key: string, state: FilteringState, deps: FilteringDeps): void {
  const inputs = new Map(state.filterInputs());
  inputs.delete(key);
  state.filterInputs.set(inputs);

  const currentFilters = state.filters().filter((f) => f.key !== key);
  state.filters.set(currentFilters);
  deps.onFilterChange({ filters: currentFilters });
}

/**
 * Clears all filters
 */
export function clearAllFilters(state: FilteringState, deps: FilteringDeps): void {
  state.filterInputs.set(new Map());
  state.filters.set([]);
  deps.onFilterChange({ filters: [] });
}

/**
 * Applies a single filter to a row
 */
export function applyFilterToRow<T>(row: T, filter: FilterConfig): boolean {
  const value = (row as any)[filter.key];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return String(value).toLowerCase() === String(filterValue).toLowerCase();
    case 'notEquals':
      return String(value).toLowerCase() !== String(filterValue).toLowerCase();
    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'notContains':
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
    case 'greaterThan':
      return Number(value) > Number(filterValue);
    case 'lessThan':
      return Number(value) < Number(filterValue);
    case 'greaterThanOrEqual':
      return Number(value) >= Number(filterValue);
    case 'lessThanOrEqual':
      return Number(value) <= Number(filterValue);
    case 'between':
      // Assuming filterValue is an array [min, max]
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        return Number(value) >= Number(filterValue[0]) && Number(value) <= Number(filterValue[1]);
      }
      return true;
    case 'inList':
      // Assuming filterValue is an array
      if (Array.isArray(filterValue)) {
        return filterValue.some((v) => String(value).toLowerCase() === String(v).toLowerCase());
      }
      return true;
    default:
      return true;
  }
}

/**
 * Applies all filters to data
 */
export function applyFiltering<T>(data: T[], state: FilteringState): T[] {
  const activeFilters = state.filters();
  if (activeFilters.length === 0) return data;

  return data.filter((row) => activeFilters.every((filter) => applyFilterToRow(row, filter)));
}
