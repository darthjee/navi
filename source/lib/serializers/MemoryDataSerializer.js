import { Serializer } from './Serializer.js';

/**
 * Serializes one or more MemoryData instances into plain data objects.
 * @augments Serializer
 * @author darthjee
 */
class MemoryDataSerializer extends Serializer {
  /**
   * Serializes a single MemoryData instance.
   *
   * @param {import('../utils/memory/MemoryData.js').MemoryData} entry - The memory entry to serialize.
   * @returns {{ id: number, value: number, percentage: number, timestamp: string }} Plain object representation of the memory entry.
   */
  static _serializeObject(entry) {
    return {
      id: entry.id,
      value: entry.value,
      percentage: entry.percentage,
      timestamp: entry.timestamp.toISOString(),
    };
  }
}

export { MemoryDataSerializer };
