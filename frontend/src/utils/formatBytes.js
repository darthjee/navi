const UNITS = ['B', 'KB', 'MB', 'GB'];
const UNIT_STEP = 1024;

/**
 * Formats a non-negative number of bytes as a human-readable string,
 * picking the largest 1024-based unit (B, KB, MB, GB) where the value is `>= 1`.
 * @param {number} bytes - The raw byte count.
 * @returns {string} The formatted value, e.g. `"85.0 MB"`.
 */
const formatBytes = (bytes) => {
  let value = bytes;
  let unitIndex = 0;

  while (value >= UNIT_STEP && unitIndex < UNITS.length - 1) {
    value /= UNIT_STEP;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${UNITS[unitIndex]}`;
};

export default formatBytes;
