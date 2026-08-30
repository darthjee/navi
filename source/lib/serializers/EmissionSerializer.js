import { Serializer } from './Serializer.js';

/**
 * Serializes one or more EmissionRecord instances into plain data objects.
 * @augments Serializer
 * @author darthjee
 */
class EmissionSerializer extends Serializer {
  /**
   * Serializes a single EmissionRecord instance.
   *
   * @param {import('../utils/emissions/EmissionRecord.js').EmissionRecord} record - The emission record to serialize.
   * @returns {{ id: number, extractionId: (number|null), status: string, url: string, method: string, httpStatus: (number|null), error: (string|null), itemRef: (string|null), timestamp: string }} Plain object representation of the emission record.
   */
  static _serializeObject(record) {
    return {
      id: record.id,
      extractionId: record.extractionId,
      status: record.status,
      url: record.url,
      method: record.method,
      httpStatus: record.httpStatus,
      error: record.error,
      itemRef: record.itemRef,
      timestamp: record.timestamp.toISOString(),
    };
  }
}

export { EmissionSerializer };
