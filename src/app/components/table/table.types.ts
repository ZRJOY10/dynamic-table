// ============================================================================
// Dynamic Table Types & Interfaces
// ============================================================================

export interface ColumnConfig<T = any> {
  /** Unique key/field name in data object */
  key: string;
  /** Display title for column header */
  title: string;
  /** Column order (lower = left) */
  order: number;
  /** Column width in pixels */
  width?: number;
  /** Minimum width for resizing */
  minWidth?: number;
  /** Maximum width for resizing */
  maxWidth?: number;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Whether column is resizable */
  resizable?: boolean;
  /** Whether column is frozen (sticky) */
  frozen?: boolean;
  /** Freeze position: 'left' or 'right' */
  frozenPosition?: 'left' | 'right';
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom cell renderer type */
  cellType?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
  /** Date format for date cells */
  dateFormat?: string;
  /** Custom cell template name */
  templateName?: string;
  /** Whether column is visible */
  visible?: boolean;
  /** Custom filter type */
  filterType?: 'text' | 'number' | 'date' | 'select' | 'boolean';
  /** Options for select filter */
  filterOptions?: { label: string; value: any }[];
  /** Custom sort comparator */
  sortComparator?: (a: T, b: T, direction: SortDirection) => number;
  /** Custom cell formatter */
  formatter?: (value: any, row: T) => string;
  /** Whether this is a computed column */
  isComputed?: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
  order: number; // For multi-sort priority
}

export interface FilterConfig {
  key: string;
  value: any;
  operator: FilterOperator;
}

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'inList';

export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface SelectionConfig {
  enabled: boolean;
  mode: 'single' | 'multiple';
  showCheckbox: boolean;
}

export interface TableConfig {
  /** Enable/disable features */
  enableMultiSort?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableVirtualScroll?: boolean;
  enableFrozenColumns?: boolean;

  /** Virtual scroll settings */
  virtualScrollItemHeight?: number;
  virtualScrollBufferSize?: number;

  /** Pagination settings */
  pageSize?: number;
  pageSizeOptions?: number[];

  /** Selection settings */
  selectionMode?: 'single' | 'multiple';
  showSelectionCheckbox?: boolean;

  /** Styling */
  stripedRows?: boolean;
  hoverHighlight?: boolean;
  bordered?: boolean;
  compact?: boolean;

  /** Row height */
  rowHeight?: number;

  /** Table height for virtual scroll */
  tableHeight?: number;

  /** Empty state message */
  emptyMessage?: string;

  /** Loading state */
  showLoading?: boolean;

  /** Row key field for tracking */
  rowKeyField?: string;
}

export interface RowSelectionEvent<T = any> {
  selected: T[];
  row?: T;
  isSelected: boolean;
}

export interface SortChangeEvent {
  sorts: SortConfig[];
}

export interface FilterChangeEvent {
  filters: FilterConfig[];
}

export interface PageChangeEvent {
  page: number;
  pageSize: number;
}

export interface ColumnResizeEvent {
  column: string;
  width: number;
}

export interface ColumnReorderEvent {
  columns: ColumnConfig[];
  movedColumn: string;
  fromIndex: number;
  toIndex: number;
}

// Default configurations
export const DEFAULT_TABLE_CONFIG: TableConfig = {
  enableMultiSort: true,
  enableFiltering: true,
  enablePagination: true,
  enableRowSelection: true,
  enableColumnResize: true,
  enableColumnReorder: true,
  enableVirtualScroll: false,
  enableFrozenColumns: true,
  virtualScrollItemHeight: 48,
  virtualScrollBufferSize: 5,
  pageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  selectionMode: 'multiple',
  showSelectionCheckbox: true,
  stripedRows: true,
  hoverHighlight: true,
  bordered: true,
  compact: false,
  rowHeight: 48,
  tableHeight: 600,
  emptyMessage: 'No data available',
  showLoading: false,
  rowKeyField: 'id',
};

export const DEFAULT_COLUMN_CONFIG: Partial<ColumnConfig> = {
  width: 150,
  minWidth: 50,
  maxWidth: 500,
  sortable: true,
  filterable: true,
  resizable: true,
  frozen: false,
  align: 'left',
  cellType: 'text',
  visible: true,
  filterType: 'text',
};
