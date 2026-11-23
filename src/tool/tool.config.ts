import type { ToolConfig } from '@itsjust/core';

export const toolConfig: ToolConfig = {
  id: 'line-sorter-and-dedupe',
  name: 'Line Sorter & Dedupe',
  description:
    'Paste text lines and sort, dedupe, reverse, shuffle, trim, or filter them with one click.',
  version: '1.0.0',
  exportFormats: ['png', 'pdf', 'json'],
  features: {
    export: true,
    autoSave: true,
    undoRedo: true,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#0ea5e9',
    icon: '↕',
  },
};

export default toolConfig;
