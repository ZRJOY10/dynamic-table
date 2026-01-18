import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ElementRef,
  viewChild,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Types
import {
  ColumnConfig,
  TableConfig,
  RowSelectionEvent,
  SortChangeEvent,
  FilterChangeEvent,
  PageChangeEvent,
  ColumnResizeEvent,
  ColumnReorderEvent,
  DEFAULT_TABLE_CONFIG,
} from './table.types';

// Features
import {
  // Sorting
  SortingState,
  createSortingState,
  handleHeaderClick,
  getSortDirection,
  getSortOrder,
  applySorting,
  resetSorting,
  // Filtering
  FilteringState,
  createFilteringState,
  handleFilterInput,
  getFilterValue,
  clearFilter,
  clearAllFilters,
  applyFiltering,
  // Selection
  SelectionState,
  createSelectionState,
  toggleRowSelection,
  toggleAllSelection,
  isRowSelected,
  computeAllSelected,
  computeSomeSelected,
  getSelectedRows,
  clearSelection,
  // Pagination
  PaginationState,
  createPaginationState,
  computeTotalPages,
  computePageNumbers,
  goToPage,
  changePageSize,
  goToPreviousPage,
  goToNextPage,
  applyPagination,
  resetPagination,
  // Column Resize
  ColumnResizeState,
  createColumnResizeState,
  startResize,
  handleResizeMove,
  endResize,
  applyCustomWidths,
  // Column Reorder
  ColumnReorderState,
  createColumnReorderState,
  initializeColumnOrder,
  startDrag,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  applyColumnOrder,
  // Virtual Scroll
  VirtualScrollState,
  createVirtualScrollState,
  handleScroll,
  computeVirtualScrollData,
  getVirtualScrollConfig,
  // Column Utils
  processColumns,
  getFrozenLeftColumns,
  getFrozenRightColumns,
  getScrollableColumns,
  getVisibleColumns,
  getColumnStyle,
  getFrozenLeftOffset,
  getFrozenRightOffset,
  getCellValue,
  defaultCompare,
  trackByColumn,
  // Column Visibility
  ColumnVisibilityState,
  createColumnVisibilityState,
  toggleDropdown,
  closeDropdown,
  toggleColumnVisibility,
  isColumnVisible,
  showAllColumns,
  hideAllColumns,
  // Computed Columns
  ComputedColumnsState,
  ComputedColumnDefinition,
  ColumnCondition,
  createComputedColumnsState,
  openComputedColumnModal,
  closeComputedColumnModal,
  createEmptyComputedColumn,
  createEmptyCondition,
  addComputedColumn,
  updateComputedColumn,
  removeComputedColumn,
  computeColumnValue,
  computedColumnToColumnConfig,
  CONDITION_OPERATORS,
} from './features';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.html',
  styleUrl: './table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table<T extends Record<string, any> = any> {
  // For template usage
  protected readonly Math = Math;

  // ============================================================================
  // Inputs
  // ============================================================================
  readonly data = input.required<T[]>();
  readonly columns = input.required<ColumnConfig<T>[]>();
  readonly config = input<TableConfig>({});

  // ============================================================================
  // Outputs
  // ============================================================================
  readonly selectionChange = output<RowSelectionEvent<T>>();
  readonly sortChange = output<SortChangeEvent>();
  readonly filterChange = output<FilterChangeEvent>();
  readonly pageChange = output<PageChangeEvent>();
  readonly columnResize = output<ColumnResizeEvent>();
  readonly columnReorder = output<ColumnReorderEvent>();

  // ============================================================================
  // View References
  // ============================================================================
  readonly tableContainer = viewChild<ElementRef>('tableContainer');
  readonly tableBody = viewChild<ElementRef>('tableBody');

  // ============================================================================
  // Feature States
  // ============================================================================
  private readonly sortingState: SortingState = createSortingState();
  private readonly filteringState: FilteringState = createFilteringState();
  private readonly selectionState: SelectionState = createSelectionState();
  private readonly paginationState: PaginationState = createPaginationState();
  private readonly resizeState: ColumnResizeState = createColumnResizeState();
  private readonly reorderState: ColumnReorderState = createColumnReorderState();
  private readonly virtualScrollState: VirtualScrollState = createVirtualScrollState();
  private readonly columnVisibilityState: ColumnVisibilityState = createColumnVisibilityState();
  private readonly computedColumnsState: ComputedColumnsState = createComputedColumnsState();

  // Expose state signals for template
  protected readonly sorts = this.sortingState.sorts;
  protected readonly filters = this.filteringState.filters;
  protected readonly currentPage = this.paginationState.currentPage;
  protected readonly pageSize = this.paginationState.pageSize;
  protected readonly selectedRows = this.selectionState.selectedRows;
  protected readonly draggedColumn = this.reorderState.draggedColumn;
  protected readonly dropTargetColumn = this.reorderState.dropTargetColumn;
  protected readonly resizingColumn = this.resizeState.resizingColumn;
  protected readonly hiddenColumns = this.columnVisibilityState.hiddenColumns;
  protected readonly columnVisibilityDropdownOpen = this.columnVisibilityState.dropdownOpen;
  protected readonly computedColumns = this.computedColumnsState.computedColumns;
  protected readonly computedColumnModalOpen = this.computedColumnsState.modalOpen;
  protected readonly editingComputedColumn = this.computedColumnsState.editingColumn;

  // Computed column form state
  protected readonly currentComputedColumn = signal<ComputedColumnDefinition>(createEmptyComputedColumn());
  protected readonly conditionOperators = CONDITION_OPERATORS;

  // ============================================================================
  // Computed Properties
  // ============================================================================
  protected readonly mergedConfig = computed<TableConfig>(() => ({
    ...DEFAULT_TABLE_CONFIG,
    ...this.config(),
  }));

  // All columns including computed ones
  protected readonly allColumns = computed<ColumnConfig<T>[]>(() => {
    const baseColumns = [...this.columns()];
    const computedCols = this.computedColumns();
    
    // Add computed columns
    const computedColumnConfigs = computedCols.map((cc, idx) => 
      computedColumnToColumnConfig<T>(cc, baseColumns.length + idx)
    );
    
    return [...baseColumns, ...computedColumnConfigs];
  });

  protected readonly processedColumns = computed<ColumnConfig<T>[]>(() => {
    let cols = processColumns(this.allColumns());
    cols = applyCustomWidths(cols, this.resizeState);
    cols = applyColumnOrder(cols, this.reorderState);
    
    // Filter out hidden columns
    const hidden = this.hiddenColumns();
    cols = cols.filter(col => !hidden.has(col.key));
    
    return getVisibleColumns(cols);
  });

  protected readonly frozenLeftColumns = computed(() =>
    getFrozenLeftColumns(this.processedColumns())
  );

  protected readonly frozenRightColumns = computed(() =>
    getFrozenRightColumns(this.processedColumns())
  );

  protected readonly scrollableColumns = computed(() =>
    getScrollableColumns(this.processedColumns())
  );

  protected readonly filteredData = computed<T[]>(() =>
    applyFiltering([...this.data()], this.filteringState)
  );

  protected readonly sortedData = computed<T[]>(() =>
    applySorting(
      this.filteredData(),
      this.sortingState,
      this.columns(),
      defaultCompare
    )
  );

  protected readonly paginatedData = computed<T[]>(() =>
    applyPagination(
      this.sortedData(),
      this.paginationState,
      this.mergedConfig().enablePagination ?? true
    )
  );

  protected readonly virtualScrollData = computed(() => {
    const config = getVirtualScrollConfig(this.mergedConfig());
    return computeVirtualScrollData(
      this.sortedData(),
      this.paginatedData(),
      this.virtualScrollState,
      config
    );
  });

  protected readonly totalItems = computed(() => this.filteredData().length);

  protected readonly totalPages = computed(() =>
    computeTotalPages(this.totalItems(), this.pageSize())
  );

  protected readonly allSelected = computed(() => {
    const keyField = this.mergedConfig().rowKeyField || 'id';
    return computeAllSelected(this.paginatedData(), this.selectedRows(), keyField);
  });

  protected readonly someSelected = computed(() => {
    const keyField = this.mergedConfig().rowKeyField || 'id';
    return computeSomeSelected(this.paginatedData(), this.selectedRows(), keyField);
  });

  protected readonly pageNumbers = computed(() =>
    computePageNumbers(this.totalPages(), this.currentPage())
  );

  // ============================================================================
  // Constructor & Effects
  // ============================================================================
  constructor() {
    // Initialize page size from config
    effect(() => {
      const config = this.mergedConfig();
      if (config.pageSize) {
        this.paginationState.pageSize.set(config.pageSize);
      }
    });

    // Reset to first page when filters change
    effect(
      () => {
        this.filters();
        resetPagination(this.paginationState);
      },
      { allowSignalWrites: true }
    );

    // Initialize column order from columns input
    effect(
      () => {
        initializeColumnOrder(this.columns(), this.reorderState);
      },
      { allowSignalWrites: true }
    );
  }

  // ============================================================================
  // Sorting Methods (delegated to feature)
  // ============================================================================
  protected onHeaderClick(column: ColumnConfig<T>, event: MouseEvent): void {
    handleHeaderClick(column, event, this.sortingState, {
      columns: () => this.columns(),
      enableMultiSort: () => this.mergedConfig().enableMultiSort ?? true,
      onSortChange: (e) => this.sortChange.emit(e),
    });
  }

  protected getSortDirection(key: string) {
    return getSortDirection(key, this.sortingState);
  }

  protected getSortOrder(key: string) {
    return getSortOrder(key, this.sortingState);
  }

  // ============================================================================
  // Filtering Methods (delegated to feature)
  // ============================================================================
  protected onFilterInput(column: ColumnConfig<T>, value: string): void {
    handleFilterInput(column, value, this.filteringState, {
      onFilterChange: (e) => this.filterChange.emit(e),
    });
  }

  protected getFilterValue(key: string): string {
    return getFilterValue(key, this.filteringState);
  }

  protected clearFilter(key: string): void {
    clearFilter(key, this.filteringState, {
      onFilterChange: (e) => this.filterChange.emit(e),
    });
  }

  protected clearAllFilters(): void {
    clearAllFilters(this.filteringState, {
      onFilterChange: (e) => this.filterChange.emit(e),
    });
  }

  // ============================================================================
  // Selection Methods (delegated to feature)
  // ============================================================================
  protected toggleRowSelection(row: T, event?: MouseEvent): void {
    toggleRowSelection(row, this.selectionState, {
      data: () => this.data(),
      paginatedData: () => this.paginatedData(),
      config: () => this.mergedConfig(),
      onSelectionChange: (e) => this.selectionChange.emit(e),
    });
  }

  protected toggleAllSelection(): void {
    toggleAllSelection(this.allSelected(), this.selectionState, {
      data: () => this.data(),
      paginatedData: () => this.paginatedData(),
      config: () => this.mergedConfig(),
      onSelectionChange: (e) => this.selectionChange.emit(e),
    });
  }

  protected isRowSelected(row: T): boolean {
    return isRowSelected(row, this.selectionState, this.mergedConfig());
  }

  // ============================================================================
  // Pagination Methods (delegated to feature)
  // ============================================================================
  protected goToPage(page: number | string): void {
    goToPage(page, this.paginationState, {
      totalItems: () => this.totalItems(),
      onPageChange: (e) => this.pageChange.emit(e),
    });
  }

  protected onPageSizeChange(size: number): void {
    changePageSize(size, this.paginationState, {
      totalItems: () => this.totalItems(),
      onPageChange: (e) => this.pageChange.emit(e),
    });
  }

  protected goToPreviousPage(): void {
    goToPreviousPage(this.paginationState, {
      totalItems: () => this.totalItems(),
      onPageChange: (e) => this.pageChange.emit(e),
    });
  }

  protected goToNextPage(): void {
    goToNextPage(this.paginationState, {
      totalItems: () => this.totalItems(),
      onPageChange: (e) => this.pageChange.emit(e),
    });
  }

  // ============================================================================
  // Column Resize Methods (delegated to feature)
  // ============================================================================
  protected onResizeStart(column: ColumnConfig<T>, event: MouseEvent): void {
    startResize(column, event, this.resizeState);
  }

  @HostListener('document:mousemove', ['$event'])
  protected onResizeMove(event: MouseEvent): void {
    handleResizeMove(event, this.resizeState, {
      processedColumns: () => this.processedColumns(),
      onColumnResize: (e) => this.columnResize.emit(e),
    });
  }

  @HostListener('document:mouseup')
  protected onResizeEnd(): void {
    endResize(this.resizeState, {
      processedColumns: () => this.processedColumns(),
      onColumnResize: (e) => this.columnResize.emit(e),
    });
  }

  // ============================================================================
  // Column Drag & Drop Methods (delegated to feature)
  // ============================================================================
  protected onDragStart(column: ColumnConfig<T>, event: DragEvent): void {
    startDrag(column, event, this.reorderState, {
      enableColumnReorder: () => this.mergedConfig().enableColumnReorder ?? true,
      processedColumns: () => this.processedColumns(),
      onColumnReorder: (e) => this.columnReorder.emit(e),
    });
  }

  protected onDragOver(column: ColumnConfig<T>, event: DragEvent): void {
    handleDragOver(column, event, this.reorderState, {
      enableColumnReorder: () => this.mergedConfig().enableColumnReorder ?? true,
      processedColumns: () => this.processedColumns(),
      onColumnReorder: (e) => this.columnReorder.emit(e),
    });
  }

  protected onDragLeave(): void {
    handleDragLeave(this.reorderState);
  }

  protected onDrop(column: ColumnConfig<T>, event: DragEvent): void {
    handleDrop(column, event, this.reorderState, {
      enableColumnReorder: () => this.mergedConfig().enableColumnReorder ?? true,
      processedColumns: () => this.processedColumns(),
      onColumnReorder: (e) => this.columnReorder.emit(e),
    });
  }

  protected onDragEnd(): void {
    handleDragEnd(this.reorderState);
  }

  // ============================================================================
  // Virtual Scroll Methods (delegated to feature)
  // ============================================================================
  protected onScroll(event: Event): void {
    handleScroll(event, this.virtualScrollState);
  }

  // ============================================================================
  // Column Visibility Methods
  // ============================================================================
  protected toggleColumnVisibilityDropdown(): void {
    toggleDropdown(this.columnVisibilityState);
  }

  protected closeColumnVisibilityDropdown(): void {
    closeDropdown(this.columnVisibilityState);
  }

  protected toggleColumnVisibility(columnKey: string): void {
    toggleColumnVisibility(this.columnVisibilityState, columnKey);
  }

  protected isColumnVisible(columnKey: string): boolean {
    return isColumnVisible(this.columnVisibilityState, columnKey);
  }

  protected showAllColumns(): void {
    showAllColumns(this.columnVisibilityState);
  }

  protected hideAllColumns(): void {
    hideAllColumns(this.columnVisibilityState, this.allColumns().map(c => c.key));
  }

  // ============================================================================
  // Computed Column Methods
  // ============================================================================
  protected openAddColumnModal(): void {
    this.currentComputedColumn.set(createEmptyComputedColumn());
    openComputedColumnModal(this.computedColumnsState);
  }

  protected openEditColumnModal(column: ComputedColumnDefinition): void {
    this.currentComputedColumn.set({ ...column, conditions: [...column.conditions] });
    openComputedColumnModal(this.computedColumnsState, column);
  }

  protected closeColumnModal(): void {
    closeComputedColumnModal(this.computedColumnsState);
  }

  protected addCondition(): void {
    this.currentComputedColumn.update(col => ({
      ...col,
      conditions: [...col.conditions, createEmptyCondition()]
    }));
  }

  protected removeCondition(conditionId: string): void {
    this.currentComputedColumn.update(col => ({
      ...col,
      conditions: col.conditions.filter(c => c.id !== conditionId)
    }));
  }

  protected updateCondition(conditionId: string, field: keyof ColumnCondition, value: string): void {
    this.currentComputedColumn.update(col => ({
      ...col,
      conditions: col.conditions.map(c => 
        c.id === conditionId ? { ...c, [field]: value } : c
      )
    }));
  }

  protected updateComputedColumnField(field: 'title' | 'defaultValue', value: string): void {
    this.currentComputedColumn.update(col => ({
      ...col,
      [field]: value
    }));
  }

  protected saveComputedColumn(): void {
    const column = this.currentComputedColumn();
    if (!column.title.trim()) return;

    if (this.editingComputedColumn()) {
      updateComputedColumn(this.computedColumnsState, column);
    } else {
      addComputedColumn(this.computedColumnsState, column);
    }
    this.closeColumnModal();
  }

  protected deleteComputedColumn(columnKey: string): void {
    removeComputedColumn(this.computedColumnsState, columnKey);
  }

  // ============================================================================
  // Utility Methods (delegated to feature)
  // ============================================================================
  protected getCellValue(row: T, column: ColumnConfig<T>): any {
    // Handle computed columns
    if (column.isComputed) {
      const computedCol = this.computedColumns().find(c => c.key === column.key);
      if (computedCol) {
        return computeColumnValue(row, computedCol);
      }
    }
    return getCellValue(row, column);
  }

  protected getColumnStyle(column: ColumnConfig<T>): Record<string, string> {
    return getColumnStyle(column);
  }

  protected getFrozenLeftOffset(column: ColumnConfig<T>): string {
    return getFrozenLeftOffset(column, this.frozenLeftColumns(), this.mergedConfig());
  }

  protected getFrozenRightOffset(column: ColumnConfig<T>): string {
    return getFrozenRightOffset(column, this.frozenRightColumns());
  }

  protected trackByKey(index: number, row: T): any {
    const keyField = this.mergedConfig().rowKeyField || 'id';
    return row[keyField] ?? index;
  }

  protected trackByColumn(index: number, column: ColumnConfig<T>): string {
    return trackByColumn(index, column);
  }

  // ============================================================================
  // Public API
  // ============================================================================
  public getSelectedRows(): T[] {
    return getSelectedRows(this.selectionState, {
      data: () => this.data(),
      paginatedData: () => this.paginatedData(),
      config: () => this.mergedConfig(),
      onSelectionChange: (e) => this.selectionChange.emit(e as RowSelectionEvent<T>),
    });
  }

  public clearSelection(): void {
    clearSelection(this.selectionState, {
      onSelectionChange: (e) => this.selectionChange.emit(e as RowSelectionEvent<T>),
    });
  }

  public resetSort(): void {
    resetSorting(this.sortingState, {
      onSortChange: (e) => this.sortChange.emit(e),
    });
  }

  public resetFilters(): void {
    this.clearAllFilters();
  }

  public resetAll(): void {
    this.clearSelection();
    this.resetSort();
    this.resetFilters();
    resetPagination(this.paginationState);
  }
}
