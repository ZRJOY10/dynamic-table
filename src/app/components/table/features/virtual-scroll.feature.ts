import { signal, WritableSignal } from '@angular/core';
import { TableConfig } from '../table.types';

export interface VirtualScrollState {
  scrollTop: WritableSignal<number>;
}

export interface VirtualScrollData<T> {
  visibleData: T[];
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

export interface VirtualScrollConfig {
  enabled: boolean;
  itemHeight: number;
  bufferSize: number;
  containerHeight: number;
}

/**
 * Creates virtual scroll state signals
 */
export function createVirtualScrollState(): VirtualScrollState {
  return {
    scrollTop: signal(0),
  };
}

/**
 * Handles scroll event
 */
export function handleScroll(event: Event, state: VirtualScrollState): void {
  const target = event.target as HTMLElement;
  state.scrollTop.set(target.scrollTop);
}

/**
 * Computes virtual scroll data
 */
export function computeVirtualScrollData<T>(
  data: T[],
  paginatedData: T[],
  state: VirtualScrollState,
  config: VirtualScrollConfig
): VirtualScrollData<T> {
  if (!config.enabled) {
    return {
      visibleData: paginatedData,
      startIndex: 0,
      endIndex: paginatedData.length,
      offsetY: 0,
      totalHeight: paginatedData.length * config.itemHeight,
    };
  }

  const scrollPos = state.scrollTop();
  const startIndex = Math.max(0, Math.floor(scrollPos / config.itemHeight) - config.bufferSize);
  const visibleCount = Math.ceil(config.containerHeight / config.itemHeight) + config.bufferSize * 2;
  const endIndex = Math.min(data.length, startIndex + visibleCount);

  return {
    visibleData: data.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * config.itemHeight,
    totalHeight: data.length * config.itemHeight,
  };
}

/**
 * Gets virtual scroll configuration from table config
 */
export function getVirtualScrollConfig(config: TableConfig): VirtualScrollConfig {
  return {
    enabled: config.enableVirtualScroll ?? false,
    itemHeight: config.virtualScrollItemHeight ?? 48,
    bufferSize: config.virtualScrollBufferSize ?? 5,
    containerHeight: config.tableHeight ?? 600,
  };
}

/**
 * Resets scroll position
 */
export function resetScroll(state: VirtualScrollState): void {
  state.scrollTop.set(0);
}

/**
 * Scrolls to a specific row index
 */
export function scrollToIndex(
  index: number,
  state: VirtualScrollState,
  config: VirtualScrollConfig
): void {
  state.scrollTop.set(index * config.itemHeight);
}

/**
 * Scrolls to top
 */
export function scrollToTop(state: VirtualScrollState): void {
  state.scrollTop.set(0);
}

/**
 * Scrolls to bottom
 */
export function scrollToBottom<T>(
  data: T[],
  state: VirtualScrollState,
  config: VirtualScrollConfig
): void {
  const totalHeight = data.length * config.itemHeight;
  const maxScroll = Math.max(0, totalHeight - config.containerHeight);
  state.scrollTop.set(maxScroll);
}
