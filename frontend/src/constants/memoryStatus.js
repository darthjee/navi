const CLASS_BY_STATUS = {
  low:    'text-memory-low',
  medium: 'text-memory-medium',
  high:   'text-memory-high',
  over:   'text-memory-over',
};

const OVER_LIMIT_CLASS = 'text-memory-over-limit';

/**
 * Resolves the CSS class to use for a given memory status and percentage.
 * @param {string} status - The backend-reported status (`low`/`medium`/`high`/`over`).
 * @param {number} percentage - The memory usage percentage (can exceed 100).
 * @returns {string} The CSS class representing the color for this status.
 */
const colorForMemoryStatus = (status, percentage) => {
  if (percentage > 100) {
    return OVER_LIMIT_CLASS;
  }

  return CLASS_BY_STATUS[status];
};

// Hex equivalents of CLASS_BY_STATUS, kept in sync by hand with
// MemoryStatus.css's `.text-memory-*` rules. Needed because chart libraries
// (e.g. recharts) take color values as props, not CSS classes.
const HEX_BY_STATUS = {
  low:    '#495057',
  medium: '#198754',
  high:   '#ffc107',
  over:   '#dc3545',
};

const OVER_LIMIT_HEX = '#6f42c1';

// Default memory usage thresholds, mirroring the backend's
// `MemoryConfig.DEFAULT_THRESHOLDS` (source/lib/models/configs/MemoryConfig.js).
// `/memory/status.json` does not return the deployment's actual configured
// thresholds, so this can drift from a deployment overriding
// `web.memory.thresholds` (accepted for v1).
const DEFAULT_MEMORY_THRESHOLDS = { medium: 50, high: 75, over: 100 };

export {
  CLASS_BY_STATUS,
  colorForMemoryStatus,
  HEX_BY_STATUS,
  OVER_LIMIT_HEX,
  DEFAULT_MEMORY_THRESHOLDS,
};
