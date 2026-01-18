import { ColumnConfig, TableConfig, DEFAULT_COLUMN_CONFIG } from '../table.types';

/**
 * Processes and merges column configurations with defaults
 */
export function processColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.map((col) => ({
    ...DEFAULT_COLUMN_CONFIG,
    ...col,
  }));
}

/**
 * Filters columns to get frozen left columns
 */
export function getFrozenLeftColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.filter((col) => col.frozen && col.frozenPosition !== 'right');
}

/**
 * Filters columns to get frozen right columns
 */
export function getFrozenRightColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.filter((col) => col.frozen && col.frozenPosition === 'right');
}

/**
 * Filters columns to get scrollable (non-frozen) columns
 */
export function getScrollableColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.filter((col) => !col.frozen);
}

/**
 * Filters visible columns
 */
export function getVisibleColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  return columns.filter((col) => col.visible !== false);
}

/**
 * Gets column style object
 */
export function getColumnStyle<T>(column: ColumnConfig<T>): Record<string, string> {
  return {
    width: `${column.width || 150}px`,
    minWidth: `${column.minWidth || 50}px`,
    maxWidth: `${column.maxWidth || 500}px`,
    textAlign: column.align || 'left',
  };
}

/**
 * Calculates frozen left column offset
 */
export function getFrozenLeftOffset<T>(
  column: ColumnConfig<T>,
  frozenLeftColumns: ColumnConfig<T>[],
  config: TableConfig
): string {
  const index = frozenLeftColumns.findIndex((c) => c.key === column.key);
  let offset = 0;

  // Add checkbox column width if present
  if (config.enableRowSelection && config.showSelectionCheckbox) {
    offset += 48;
  }

  for (let i = 0; i < index; i++) {
    offset += frozenLeftColumns[i].width || 150;
  }
  
  return `${offset}px`;
}

/**
 * Calculates frozen right column offset
 */
export function getFrozenRightOffset<T>(
  column: ColumnConfig<T>,
  frozenRightColumns: ColumnConfig<T>[]
): string {
  const index = frozenRightColumns.findIndex((c) => c.key === column.key);
  let offset = 0;
  
  for (let i = frozenRightColumns.length - 1; i > index; i--) {
    offset += frozenRightColumns[i].width || 150;
  }
  
  return `${offset}px`;
}

/**
 * Gets cell value with formatting
 */
export function getCellValue<T>(row: T, column: ColumnConfig<T>): any {
  const value = (row as any)[column.key];

  if (column.formatter) {
    return column.formatter(value, row);
  }

  switch (column.cellType) {
    case 'date':
      return value ? new Date(value).toLocaleDateString() : '';
    case 'boolean':
      return value ? '✓' : '✗';
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value;
    default:
      return value ?? '';
  }
}

/**
 * Default comparison function for sorting
 */
export function defaultCompare(a: any, b: any): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  return String(a).localeCompare(String(b));
}

/**
 * Track by function for rows
 */
export function trackByKey<T>(config: TableConfig): (index: number, row: T) => any {
  return (index: number, row: T) => {
    const keyField = config.rowKeyField || 'id';
    return (row as any)[keyField] ?? index;
  };
}

/**
 * Track by function for columns
 */
export function trackByColumn<T>(index: number, column: ColumnConfig<T>): string {
  return column.key;
}
