import { signal, computed, WritableSignal, Signal } from '@angular/core';
import { TableConfig, PageChangeEvent } from '../table.types';

export interface PaginationState {
  currentPage: WritableSignal<number>;
  pageSize: WritableSignal<number>;
}

export interface PaginationDeps {
  totalItems: () => number;
  onPageChange: (event: PageChangeEvent) => void;
}

/**
 * Creates pagination state signals
 */
export function createPaginationState(initialPageSize: number = 10): PaginationState {
  return {
    currentPage: signal(1),
    pageSize: signal(initialPageSize),
  };
}

/**
 * Computes total number of pages
 */
export function computeTotalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}

/**
 * Computes page numbers array for pagination UI
 */
export function computePageNumbers(totalPages: number, currentPage: number): (number | string)[] {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Navigates to a specific page
 */
export function goToPage(
  page: number | string,
  state: PaginationState,
  deps: PaginationDeps
): void {
  if (typeof page === 'string') return;
  
  const totalPages = computeTotalPages(deps.totalItems(), state.pageSize());
  if (page < 1 || page > totalPages) return;
  
  state.currentPage.set(page);
  deps.onPageChange({ page, pageSize: state.pageSize() });
}

/**
 * Changes the page size
 */
export function changePageSize(
  size: number,
  state: PaginationState,
  deps: PaginationDeps
): void {
  state.pageSize.set(size);
  state.currentPage.set(1);
  deps.onPageChange({ page: 1, pageSize: size });
}

/**
 * Navigates to the previous page
 */
export function goToPreviousPage(state: PaginationState, deps: PaginationDeps): void {
  if (state.currentPage() > 1) {
    goToPage(state.currentPage() - 1, state, deps);
  }
}

/**
 * Navigates to the next page
 */
export function goToNextPage(state: PaginationState, deps: PaginationDeps): void {
  const totalPages = computeTotalPages(deps.totalItems(), state.pageSize());
  if (state.currentPage() < totalPages) {
    goToPage(state.currentPage() + 1, state, deps);
  }
}

/**
 * Applies pagination to data
 */
export function applyPagination<T>(
  data: T[],
  state: PaginationState,
  enablePagination: boolean
): T[] {
  if (!enablePagination) return data;

  const start = (state.currentPage() - 1) * state.pageSize();
  const end = start + state.pageSize();
  return data.slice(start, end);
}

/**
 * Resets pagination to first page
 */
export function resetPagination(state: PaginationState): void {
  state.currentPage.set(1);
}
