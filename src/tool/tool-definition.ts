import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  summaryText,
  historyText,
  processLines,
  joinLines,
  type HistoryEntry,
  type SortDirection,
  type SortMode,
  type ToolState,
} from './types';

const VALID_SORT_MODES: SortMode[] = ['alpha', 'natural', 'length'];
const VALID_DIRECTIONS: SortDirection[] = ['asc', 'desc'];

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    input: state.input,
    sortMode: state.sortMode,
    sortDirection: state.sortDirection,
    caseSensitive: state.caseSensitive,
    trimLines: state.trimLines,
    removeDuplicates: state.removeDuplicates,
    dropEmpty: state.dropEmpty,
    reverseOrder: state.reverseOrder,
    shuffleOrder: state.shuffleOrder,
    prefix: state.prefix,
    suffix: state.suffix,
    showLineNumbers: state.showLineNumbers,
    history: state.history,
  });
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function validHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is HistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as HistoryEntry).text === 'string' &&
        typeof (entry as HistoryEntry).createdAt === 'string'
    )
    .slice(0, MAX_HISTORY);
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected line sorter state object',
    };
  }
  const v = data as Record<string, unknown>;
  const sortMode: SortMode = VALID_SORT_MODES.includes(v.sortMode as SortMode)
    ? (v.sortMode as SortMode)
    : DEFAULT_STATE.sortMode;
  const sortDirection: SortDirection = VALID_DIRECTIONS.includes(v.sortDirection as SortDirection)
    ? (v.sortDirection as SortDirection)
    : DEFAULT_STATE.sortDirection;
  const state: ToolState = {
    input: stringOr(v.input, DEFAULT_STATE.input),
    sortMode,
    sortDirection,
    caseSensitive: boolOr(v.caseSensitive, DEFAULT_STATE.caseSensitive),
    trimLines: boolOr(v.trimLines, DEFAULT_STATE.trimLines),
    removeDuplicates: boolOr(v.removeDuplicates, DEFAULT_STATE.removeDuplicates),
    dropEmpty: boolOr(v.dropEmpty, DEFAULT_STATE.dropEmpty),
    reverseOrder: boolOr(v.reverseOrder, DEFAULT_STATE.reverseOrder),
    shuffleOrder: boolOr(v.shuffleOrder, DEFAULT_STATE.shuffleOrder),
    prefix: stringOr(v.prefix, DEFAULT_STATE.prefix),
    suffix: stringOr(v.suffix, DEFAULT_STATE.suffix),
    showLineNumbers: boolOr(v.showLineNumbers, DEFAULT_STATE.showLineNumbers),
    history: validHistory(v.history),
  };
  return { success: true, data: state };
}

/** Append a history entry to state, capped at MAX_HISTORY, newest first. */
export function withHistory(state: ToolState, text: string, now = new Date()): ToolState {
  const entry: HistoryEntry = { text, createdAt: now.toISOString() };
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

/** Render the processed output as text (shuffle resolved eagerly). */
export function outputText(state: ToolState): string {
  return joinLines(processLines(state));
}

export const lineSorterTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

export { summaryText, historyText };
