import { format } from 'date-fns';

const DASH = '—';

/**
 * Formats an ISO timestamp for feed tables. Returns an em dash for missing
 * values and the raw input when it cannot be parsed as a date.
 * @param {string|null|undefined} timestamp - The ISO timestamp.
 * @returns {string} The formatted value, e.g. `"2026-08-30 12:00:00"`.
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return DASH;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export default formatTimestamp;
