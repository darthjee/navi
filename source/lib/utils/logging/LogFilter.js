/**
 * Filters a list of log entries based on query options.
 * @author darthjee
 */
class LogFilter {
  #logs;

  /**
   * @param {Array<import('./Log.js').Log>} logs - The full list of logs to filter (oldest first).
   */
  constructor(logs) {
    this.#logs = logs;
  }

  /**
   * Returns the filtered log list.
   * @param {object} [options={}] - Filter options.
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   *   Returns an empty array if the ID is not found.
   * @returns {Array<import('./Log.js').Log>} Filtered array of log entries.
   */
  filter({ lastId } = {}) {
    if (lastId === undefined) return this.#logs;

    const id = parseInt(lastId, 10);
    const index = this.#logs.findIndex(log => log.id === id);

    if (index === -1) return [];

    return this.#logs.slice(index + 1);
  }
}

export { LogFilter };
