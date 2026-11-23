export type SortDirection = 'asc' | 'desc';
export type SortMode = 'alpha' | 'natural' | 'length';
export type OutputView = 'result' | 'input';

export interface HistoryEntry {
  /** Short human readable description of the applied operation. */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

export interface ToolState {
  /** The raw input lines (joined with \n when stored). */
  input: string;
  sortMode: SortMode;
  sortDirection: SortDirection;
  caseSensitive: boolean;
  trimLines: boolean;
  removeDuplicates: boolean;
  dropEmpty: boolean;
  reverseOrder: boolean;
  shuffleOrder: boolean;
  prefix: string;
  suffix: string;
  showLineNumbers: boolean;
  history: HistoryEntry[];
}

export const DEFAULT_STATE: ToolState = {
  input: '',
  sortMode: 'alpha',
  sortDirection: 'asc',
  caseSensitive: true,
  trimLines: false,
  removeDuplicates: false,
  dropEmpty: false,
  reverseOrder: false,
  shuffleOrder: false,
  prefix: '',
  suffix: '',
  showLineNumbers: false,
  history: [],
};

export const MAX_HISTORY = 20;

/** Split input text into raw lines (final empty line from trailing newline ignored). */
export function splitLines(input: string): string[] {
  if (input === '') return [];
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

/** Natural comparison: digit runs compare numerically, letters lexically. */
export function naturalCompare(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g;
  const ax = a.match(re) ?? [];
  const bx = b.match(re) ?? [];
  const len = Math.min(ax.length, bx.length);
  for (let i = 0; i < len; i++) {
    const aPart: string = ax[i] ?? '';
    const bPart: string = bx[i] ?? '';
    const aNum = /^\d+$/.test(aPart);
    const bNum = /^\d+$/.test(bPart);
    if (aNum && bNum) {
      const diff = Number(aPart) - Number(bPart);
      if (diff !== 0) return diff;
    } else if (aNum !== bNum) {
      return aNum ? -1 : 1;
    } else if (aPart !== bPart) {
      return aPart < bPart ? -1 : 1;
    }
  }
  return ax.length - bx.length;
}

export type CompareFn = (a: string, b: string) => number;

/** Build the comparison function for the selected sort mode and case sensitivity. */
export function buildCompare(mode: SortMode, caseSensitive: boolean): CompareFn {
  const prep = (s: string) => (caseSensitive ? s : s.toLowerCase());
  switch (mode) {
    case 'natural':
      return (a, b) => naturalCompare(prep(a), prep(b));
    case 'length':
      return (a, b) => a.length - b.length || naturalCompare(prep(a), prep(b));
    default:
      return (a, b) => {
        const pa = prep(a);
        const pb = prep(b);
        if (pa === pb) return 0;
        return pa < pb ? -1 : 1;
      };
  }
}

/** Remove duplicate lines, optionally case-insensitively, keeping first occurrences. */
export function dedupeLines(lines: string[], caseSensitive: boolean): string[] {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = caseSensitive ? line : line.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stableShuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp: T = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/** Apply every enabled transformation to the input text; pure. */
export function processLines(state: ToolState, rng: () => number = Math.random): string[] {
  let lines = splitLines(state.input);
  if (state.trimLines) lines = lines.map((l) => l.trim());
  if (state.dropEmpty) lines = lines.filter((l) => l !== '');
  if (state.removeDuplicates) lines = dedupeLines(lines, state.caseSensitive);
  const compare = buildCompare(state.sortMode, state.caseSensitive);
  lines = lines.sort(compare);
  if (state.sortDirection === 'desc') lines.reverse();
  if (state.shuffleOrder) lines = stableShuffle(lines, rng);
  else if (state.reverseOrder) lines.reverse();
  if (state.showLineNumbers) lines = lines.map((l, i) => `${i + 1}. ${l}`);
  if (state.prefix !== '' || state.suffix !== '') {
    lines = lines.map((l) => `${state.prefix}${l}${state.suffix}`);
  }
  return lines;
}

/** Numbered formatting helper used by copy/download/export paths. */
export function joinLines(lines: string[]): string {
  return lines.join('\n');
}

export interface LineStats {
  lineCount: number;
  charCount: number;
  uniqueCount: number;
}

/** Statistics over the processed result. */
export function statsFor(state: ToolState, rng: () => number = Math.random): LineStats {
  const lines = processLines(state, rng);
  const unique = dedupeLines(lines, true);
  return {
    lineCount: lines.length,
    charCount: joinLines(lines).length,
    uniqueCount: unique.length,
  };
}

/** Multi-line summary used by the status bar and copy actions. */
export function summaryText(state: ToolState, rng: () => number = Math.random): string {
  const s = statsFor(state, rng);
  return `${s.lineCount} lines · ${s.uniqueCount} unique · ${s.charCount} chars`;
}

/** Build a history entry text for the current state (stable: no shuffle). */
export function historyText(state: ToolState): string {
  const s = statsFor(state);
  return `sorted/deduped to ${s.lineCount} lines (${s.uniqueCount} unique)`;
}

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return typeof v.input === 'string' && typeof v.sortMode === 'string';
}
