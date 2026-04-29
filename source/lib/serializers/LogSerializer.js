import { Serializer } from './Serializer.js';

/**
 * Serializes one or more Log instances into plain data objects.
 * @augments Serializer
 */
class LogSerializer extends Serializer {
  /**
   * Serializes a single Log instance.
   *
   * @param {import('../utils/logging/Log.js').Log} log - The log entry to serialize.
   * @returns {{ id: number, level: string, message: string, attributes: object, timestamp: string }}
   */
  static _serializeObject(log) {
    return {
      id: log.id,
      level: log.level,
      message: log.message,
      attributes: log.attributes,
      timestamp: log.timestamp.toISOString(),
    };
  }
}

export { LogSerializer };
