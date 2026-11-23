'use client';

import React from 'react';
import { SORT_MODES } from '../ui-shared';
import { statsFor } from '../types';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  const stats = statsFor(state);
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="line-sorter-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Sort modes</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {SORT_MODES.map((mode) => (
            <li key={mode.value} className="flex justify-between gap-2">
              <span>{mode.label}</span>
              <span className="text-gray-500 dark:text-gray-400">{mode.hint}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Current output</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-stats">
          {stats.lineCount} lines · {stats.uniqueCount} unique
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved outputs</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">How it works</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>Paste one item per line in the input box.</li>
          <li>Toggle transformations; the output updates live.</li>
          <li>Copy the output or save it to history.</li>
          <li>Your input is saved locally, nothing leaves the browser.</li>
        </ul>
      </div>
      <button
        type="button"
        onClick={() =>
          onChange({
            ...state,
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
          })
        }
        data-testid="btn-reset-options"
        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Reset options
      </button>
    </div>
  );
};
