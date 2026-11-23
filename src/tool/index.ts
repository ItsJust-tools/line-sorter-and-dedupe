export { default as toolConfig } from './tool.config';
export { templateBaseVersion } from './template-metadata';
export { templateMetadata, getPublicSiteUrl } from './template-metadata';
export {
  lineSorterTool,
  serializeState,
  deserializeState,
  withHistory,
  roundTrips,
  outputText,
} from './tool-definition';
export { Canvas } from './components/Canvas';
export { Sidebar } from './components/Sidebar';
export { Toolbar } from './components/Toolbar';
export { SORT_MODES, DIRECTIONS } from './ui-shared';
export {
  DEFAULT_STATE,
  MAX_HISTORY,
  splitLines,
  naturalCompare,
  buildCompare,
  dedupeLines,
  processLines,
  joinLines,
  statsFor,
  summaryText,
  historyText,
  isState,
} from './types';
export type {
  SortDirection,
  SortMode,
  OutputView,
  HistoryEntry,
  ToolState,
  LineStats,
} from './types';
