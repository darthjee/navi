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

export { CLASS_BY_STATUS, colorForMemoryStatus };
