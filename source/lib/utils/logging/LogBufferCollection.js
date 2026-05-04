import { LogBuffer } from './LogBuffer.js';
import { EngineEvents } from '../../services/EngineEvents.js';

/**
 * LogBufferCollection manages a keyed map of LogBuffer instances.
 * Buffers are created on first use and cleared automatically when the engine stops.
 * @author darthjee
 */
class LogBufferCollection {
  #buffers;
  #retention;

  /**
   * @param {number} [retention=100] - Maximum number of logs to retain per buffer.
   */
  constructor(retention = 100) {
    this.#buffers = new Map();
    this.#retention = retention;
    EngineEvents.on('stop', () => this.clear());
  }

  /**
   * Appends an existing Log instance to the buffer for the given key.
   * Lazily creates the buffer on first use.
   * @param {string|number} key - The key identifying the buffer (e.g. jobId or workerId).
   * @param {import('./Log.js').Log} log - The Log instance to append.
   * @returns {void}
   */
  push(key, log) {
    if (!this.#buffers.has(key)) {
      this.#buffers.set(key, new LogBuffer(this.#retention));
    }
    this.#buffers.get(key).push(log);
  }

  /**
   * Returns all logs for the given key in chronological order (oldest first).
   * Returns an empty array if no buffer exists for that key.
   * @param {string|number} key - The key to look up.
   * @returns {Array<import('./Log.js').Log>} Array of log entries for the given key, oldest first.
   */
  getLogs(key) {
    if (!this.#buffers.has(key)) return [];
    return this.#buffers.get(key).getLogs();
  }

  /**
   * Removes all per-key buffers.
   * @returns {void}
   */
  clear() {
    this.#buffers = new Map();
  }
}

export { LogBufferCollection };
