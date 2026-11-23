import type { SortDirection, SortMode, ToolState } from './types';

export const SORT_MODES: { value: SortMode; label: string; hint: string }[] = [
  { value: 'alpha', label: 'Alphabetical', hint: 'lexicographic order' },
  { value: 'natural', label: 'Natural', hint: 'numbers compare numerically (file2 < file10)' },
  { value: 'length', label: 'Length', hint: 'shortest lines first' },
];

export const DIRECTIONS: { value: SortDirection; label: string }[] = [
  { value: 'asc', label: 'A → Z' },
  { value: 'desc', label: 'Z → A' },
];

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return typeof v.input === 'string' && typeof v.sortMode === 'string';
}
