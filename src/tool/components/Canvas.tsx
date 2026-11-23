'use client';

import React from 'react';
import { processLines, statsFor, joinLines } from '../types';
import { SORT_MODES, DIRECTIONS } from '../ui-shared';
import type { ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

function CopyButton({ value, testid }: { value: string; testid?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testid}
      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Copy value"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onToggle,
  testid,
  hint,
}: {
  label: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
  testid: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        data-testid={testid}
        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
      />
      <span>
        {label}
        {hint ? <span className="ml-1 text-gray-400 dark:text-gray-500">({hint})</span> : null}
      </span>
    </label>
  );
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });
  const output = React.useMemo(() => processLines(state), [state]);
  const stats = React.useMemo(() => statsFor(state), [state]);
  const outputStr = joinLines(output);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="line-sorter-canvas">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Input lines
          <textarea
            value={state.input}
            onChange={(e) => update({ input: e.target.value })}
            data-testid="input-lines"
            rows={8}
            placeholder={'banana\napple\ncherry\napple'}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Sort mode
          </span>
          <div className="mt-1 flex flex-wrap gap-2" role="tablist" aria-label="Sort mode">
            {SORT_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                role="tab"
                aria-selected={state.sortMode === mode.value}
                data-testid={`sort-mode-${mode.value}`}
                title={mode.hint}
                onClick={() => update({ sortMode: mode.value })}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                  state.sortMode === mode.value
                    ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Direction
          </span>
          <div className="mt-1 flex gap-2" role="group" aria-label="Sort direction">
            {DIRECTIONS.map((dir) => (
              <button
                key={dir.value}
                type="button"
                aria-pressed={state.sortDirection === dir.value}
                data-testid={`direction-${dir.value}`}
                onClick={() => update({ sortDirection: dir.value })}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                  state.sortDirection === dir.value
                    ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
                }`}
              >
                {dir.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-900/50">
        <Toggle
          label="Case-insensitive"
          checked={!state.caseSensitive}
          onToggle={(v) => update({ caseSensitive: !v })}
          testid="toggle-case-insensitive"
          hint="for sorting and dedupe"
        />
        <Toggle
          label="Remove duplicates"
          checked={state.removeDuplicates}
          onToggle={(v) => update({ removeDuplicates: v })}
          testid="toggle-dedupe"
        />
        <Toggle
          label="Trim whitespace"
          checked={state.trimLines}
          onToggle={(v) => update({ trimLines: v })}
          testid="toggle-trim"
        />
        <Toggle
          label="Drop empty lines"
          checked={state.dropEmpty}
          onToggle={(v) => update({ dropEmpty: v })}
          testid="toggle-drop-empty"
        />
        <Toggle
          label="Reverse order"
          checked={state.reverseOrder}
          onToggle={(v) => update({ reverseOrder: v })}
          testid="toggle-reverse"
        />
        <Toggle
          label="Shuffle order"
          checked={state.shuffleOrder}
          onToggle={(v) => update({ shuffleOrder: v })}
          testid="toggle-shuffle"
        />
        <Toggle
          label="Show line numbers"
          checked={state.showLineNumbers}
          onToggle={(v) => update({ showLineNumbers: v })}
          testid="toggle-numbers"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Prefix (added to every line)
          <input
            type="text"
            value={state.prefix}
            onChange={(e) => update({ prefix: e.target.value })}
            data-testid="input-prefix"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Suffix (added to every line)
          <input
            type="text"
            value={state.suffix}
            onChange={(e) => update({ suffix: e.target.value })}
            data-testid="input-suffix"
            className={inputClass}
          />
        </label>
      </div>

      <div
        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        data-testid="result-card"
        role="status"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Output
          </span>
          <CopyButton value={outputStr} testid="copy-output" />
        </div>
        <span className="block text-xs text-gray-600 dark:text-gray-300" data-testid="result-stats">
          {stats.lineCount} lines · {stats.uniqueCount} unique · {stats.charCount} chars
        </span>
        <pre
          className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:bg-gray-950 dark:text-gray-200"
          data-testid="output-lines"
        >
          {outputStr || '—'}
        </pre>
        <button
          type="button"
          data-testid="btn-save-history"
          onClick={() => onSaveHistory?.(outputStr)}
          disabled={output.length === 0}
          className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Save to history
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved outputs yet.
          </p>
        ) : (
          <ul className="space-y-1" data-testid="history-list">
            {state.history.map((entry, i) => (
              <li
                key={`${entry.createdAt}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"
              >
                <span className="truncate text-gray-700 dark:text-gray-300" title={entry.text}>
                  {entry.text}
                </span>
                <CopyButton value={entry.text} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        All processing runs locally in your browser; nothing is uploaded.
      </p>
    </div>
  );
};
