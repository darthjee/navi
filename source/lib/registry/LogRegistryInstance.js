import { BufferedLogger } from '../utils/logging/BufferedLogger.js';
import { LogBufferCollection } from '../utils/logging/LogBufferCollection.js';
import { LogFilter } from '../utils/logging/LogFilter.js';
import { Logger } from '../utils/logging/Logger.js';
import { LoggerGroup } from '../utils/logging/LoggerGroup.js';

/**
 * Holds a LoggerGroup (Logger + BufferedLogger) for the LogRegistry singleton.
 * Exposes debug/info/warn/error methods that fan out to both outputs, and filtered
 * log queries via LogFilter. Not exported directly; accessed only via LogRegistry.
 * @author darthjee
 */
class LogRegistryInstance {
  #bufferedLogger;
  #loggerGroup;
  #jobLogs;
  #workerLogs;

  /**
   * Creates a new LogRegistryInstance.
   * @param {object} [options={}] - Options for the loggers.
   * @param {string} [options.level] - Log level threshold.
   * @param {number} [options.retention=100] - Maximum number of logs to retain.
   */
  constructor({ level, retention } = {}) {
    this.#bufferedLogger = new BufferedLogger(level, retention);
    this.#loggerGroup = new LoggerGroup([Logger.default(), this.#bufferedLogger]);
    this.#jobLogs = new LogBufferCollection(retention);
    this.#workerLogs = new LogBufferCollection(retention);
  }

  /**
   * Returns the underlying BufferedLogger instance.
   * @returns {BufferedLogger}
   */
  get bufferedLogger() {
    return this.#bufferedLogger;
  }

  /**
   * Logs a debug message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  debug(message, attributes = {}) {
    this.#dispatch('debug', message, attributes);
  }

  /**
   * Logs an error message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  error(message, attributes = {}) {
    this.#dispatch('error', message, attributes);
  }

  /**
   * Gets a specific log by ID.
   * @param {number} id
   * @returns {import('../utils/logging/Log.js').Log|undefined}
   */
  getLogById(id) {
    return this.#bufferedLogger.getLogById(id);
  }

  /**
   * Gets logs in chronological order (oldest first), optionally filtered to entries newer than lastId.
   * @param {object} [options={}]
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   *   Returns an empty array if the ID is not found.
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  getLogs({ lastId } = {}) {
    return new LogFilter(this.bufferedLogger.getLogs()).filter({ lastId });
  }

  /**
   * Gets logs stored in the per-job buffer for the given job ID,
   * optionally filtered to entries newer than lastId.
   * @param {string|number} jobId
   * @param {object} [options={}]
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  getLogsByJobId(jobId, { lastId } = {}) {
    return new LogFilter(this.#jobLogs.getLogs(jobId)).filter({ lastId });
  }

  /**
   * Gets logs stored in the per-worker buffer for the given worker ID.
   * @param {string|number} workerId
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  getLogsByWorkerId(workerId) {
    return this.#workerLogs.getLogs(workerId);
  }

  /**
   * Gets logs filtered by level.
   * @param {string} level
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  getLogsByLevel(level) {
    return this.#bufferedLogger.getLogsByLevel(level);
  }

  /**
   * Returns all logs as plain JSON objects.
   * @returns {Array<object>}
   */
  getLogsJSON() {
    return this.#bufferedLogger.getLogsJSON();
  }

  /**
   * Logs an info message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  info(message, attributes = {}) {
    this.#dispatch('info', message, attributes);
  }

  /**
   * Logs a warn message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  warn(message, attributes = {}) {
    this.#dispatch('warn', message, attributes);
  }

  /**
   * Fans out the log call to the logger group and, if a new log was buffered,
   * routes it to the per-job and per-worker collections based on attributes.
   * @param {string} level
   * @param {string} message
   * @param {object} attributes
   * @returns {void}
   */
  #dispatch(level, message, attributes) {
    const before = this.#bufferedLogger.latestLog;
    this.#loggerGroup[level](message, attributes);
    const log = this.#bufferedLogger.latestLog;
    if (log === before) return;
    if (attributes.jobId !== undefined) this.#jobLogs.push(attributes.jobId, log);
    if (attributes.workerId !== undefined) this.#workerLogs.push(attributes.workerId, log);
  }
}

export { LogRegistryInstance };
