import { describe, it, expect } from 'vitest';
import {
  splitLines,
  naturalCompare,
  buildCompare,
  dedupeLines,
  processLines,
  joinLines,
  statsFor,
  summaryText,
} from '@/tool/types';
import {
  deserializeState,
  serializeState,
  withHistory,
  roundTrips,
  outputText,
} from '@/tool/tool-definition';
import { DEFAULT_STATE, MAX_HISTORY, type ToolState } from '@/tool/types';
import { lineSorterTool } from '@/tool/tool-definition';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });
const R = () => 0.5; // deterministic shuffle "random"

describe('splitLines', () => {
  it('splits on newlines and handles CRLF', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
    expect(splitLines('a\r\nb\rc')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty for empty input and keeps intentional empty lines', () => {
    expect(splitLines('')).toEqual([]);
    expect(splitLines('a\n\nb')).toEqual(['a', '', 'b']);
    expect(splitLines('a\n')).toEqual(['a', '']);
  });
});

describe('naturalCompare', () => {
  it('compares digit runs numerically', () => {
    expect(naturalCompare('file2', 'file10')).toBeLessThan(0);
    expect(naturalCompare('file10', 'file2')).toBeGreaterThan(0);
    expect(naturalCompare('file2', 'file2')).toBe(0);
    expect(naturalCompare('a9b', 'a10b')).toBeLessThan(0);
    expect(naturalCompare('item007', 'item7')).toBe(0);
  });

  it('falls back to lexical comparison for non-numeric runs', () => {
    expect(naturalCompare('apple', 'banana')).toBeLessThan(0);
  });
});

describe('buildCompare', () => {
  it('sorts alphabetically', () => {
    const cmp = buildCompare('alpha', true);
    expect(['b', 'a', 'c'].sort(cmp)).toEqual(['a', 'b', 'c']);
  });

  it('ignores case when case-insensitive', () => {
    const cmp = buildCompare('alpha', false);
    expect(['b', 'A', 'c'].sort(cmp)).toEqual(['A', 'b', 'c']);
  });

  it('places uppercase before lowercase when case-sensitive', () => {
    const cmp = buildCompare('alpha', true);
    expect(['a', 'B'].sort(cmp)).toEqual(['B', 'a']);
  });

  it('sorts by length then naturally', () => {
    const cmp = buildCompare('length', false);
    expect(['ccc', 'a', 'bb'].sort(cmp)).toEqual(['a', 'bb', 'ccc']);
  });

  it('natural mode sorts numbers numerically', () => {
    const cmp = buildCompare('natural', false);
    expect(['10', '2', '1'].sort(cmp)).toEqual(['1', '2', '10']);
  });
});

describe('dedupeLines', () => {
  it('removes duplicates keeping first occurrence', () => {
    expect(dedupeLines(['a', 'b', 'a', 'b', 'c'], true)).toEqual(['a', 'b', 'c']);
  });

  it('is case-insensitive when asked', () => {
    expect(dedupeLines(['Apple', 'APPLE', 'apple'], false)).toEqual(['Apple']);
    expect(dedupeLines(['Apple', 'APPLE'], true)).toEqual(['Apple', 'APPLE']);
  });
});

describe('processLines', () => {
  it('sorts ascending and descending', () => {
    const s = state({ input: 'banana\napple\ncherry', caseSensitive: false });
    expect(processLines(s)).toEqual(['apple', 'banana', 'cherry']);
    expect(processLines({ ...s, sortDirection: 'desc' })).toEqual(['cherry', 'banana', 'apple']);
  });

  it('uses natural numeric order', () => {
    const s = state({ input: 'v10\nv2\nv1', sortMode: 'natural', caseSensitive: false });
    expect(processLines(s)).toEqual(['v1', 'v2', 'v10']);
  });

  it('dedupes case-insensitively when enabled', () => {
    const s = state({
      input: 'Apple\napple\nbanana',
      removeDuplicates: true,
      caseSensitive: false,
    });
    expect(processLines(s)).toEqual(['Apple', 'banana']);
  });

  it('trims and drops empty lines together', () => {
    const s = state({ input: '  a  \n\n  b \n   ', trimLines: true, dropEmpty: true });
    expect(processLines(s)).toEqual(['a', 'b']);
  });

  it('reverses order after sorting', () => {
    const s = state({ input: 'b\na\nc', reverseOrder: true });
    expect(processLines(s)).toEqual(['c', 'b', 'a']);
  });

  it('shuffles preserving elements (deterministic rng)', () => {
    const input = 'a\nb\nc\nd';
    const shuffled = processLines(state({ input, shuffleOrder: true }), R);
    expect([...shuffled].sort()).toEqual(['a', 'b', 'c', 'd']);
    const zero = processLines(state({ input, shuffleOrder: true }), () => 0);
    expect([...zero].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(zero).not.toEqual(['a', 'b', 'c', 'd']);
  });

  it('adds prefix, suffix and line numbers', () => {
    const s = state({
      input: 'b\na',
      caseSensitive: false,
      showLineNumbers: true,
      prefix: '- ',
      suffix: ' ;',
    });
    expect(processLines(s)).toEqual(['- 1. a ;', '- 2. b ;']);
  });

  it('keeps sort stable for equal keys', () => {
    const s = state({ input: 'bb\naa\ncc\nab', sortMode: 'length', caseSensitive: true });
    expect(processLines(s)).toEqual(['aa', 'ab', 'bb', 'cc']);
  });
});

describe('statsFor / summaryText', () => {
  it('counts lines, unique lines and chars', () => {
    const s = state({ input: 'a\nb\na', removeDuplicates: true });
    expect(statsFor(s)).toEqual({ lineCount: 2, charCount: 3, uniqueCount: 2 });
  });

  it('summarizes with counts', () => {
    const s = state({ input: 'a\nb' });
    expect(summaryText(s)).toBe('2 lines · 2 unique · 3 chars');
  });
});

describe('serialize/deserialize', () => {
  it('round-trips full state', () => {
    const s = state({
      input: 'x\ny\nz',
      sortMode: 'natural',
      sortDirection: 'desc',
      removeDuplicates: true,
      prefix: '>> ',
      history: [{ text: '3 lines', createdAt: '2026-11-23T00:00:00.000Z' }],
    });
    expect(roundTrips(s)).toBe(true);
  });

  it('round-trips defaults', () => {
    expect(roundTrips(DEFAULT_STATE)).toBe(true);
  });

  it('repairs invalid payloads', () => {
    const result = deserializeState({ nope: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(DEFAULT_STATE);
    }
  });

  it('rejects non-object payloads', () => {
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState('str').success).toBe(false);
    expect(deserializeState([1, 2]).success).toBe(false);
    expect(deserializeState(undefined).success).toBe(false);
  });

  it('normalizes invalid enum values and wrong types', () => {
    const result = deserializeState({
      sortMode: 'bogus',
      sortDirection: 'sideways',
      input: 42,
      caseSensitive: 'yes',
      history: 'nope',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortMode).toBe('alpha');
      expect(result.data.sortDirection).toBe('asc');
      expect(result.data.input).toBe('');
      expect(result.data.caseSensitive).toBe(true);
      expect(result.data.history).toEqual([]);
    }
  });

  it('caps history at MAX_HISTORY', () => {
    let s = DEFAULT_STATE;
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      s = withHistory(s, `entry ${i}`, new Date(2026, 0, 1, 0, 0, i));
    }
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.history[0]?.text).toBe(`entry ${MAX_HISTORY + 4}`);
  });

  it('serializes input with newline escapes', () => {
    expect(serializeState(state({ input: 'a\nb' }))).toContain('"input":"a\\nb"');
  });

  it('outputText joins processed lines', () => {
    expect(outputText(state({ input: 'b\na', caseSensitive: false }))).toBe('a\nb');
  });
});

describe('lineSorterTool', () => {
  it('exposes the configured identity', () => {
    expect(lineSorterTool.id).toBe('line-sorter-and-dedupe');
    expect(lineSorterTool.name).toBe('Line Sorter & Dedupe');
    expect(lineSorterTool.version).toBe('1.0.0');
  });

  it('provides initialState and exporters', () => {
    expect(lineSorterTool.initialState).toEqual(DEFAULT_STATE);
    expect(lineSorterTool.exporters?.map((e) => e.format)).toEqual(['png', 'pdf']);
  });
});

describe('joinLines', () => {
  it('joins with newline', () => {
    expect(joinLines(['a', 'b'])).toBe('a\nb');
    expect(joinLines([])).toBe('');
  });
});
