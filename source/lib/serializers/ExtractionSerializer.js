import { Serializer } from './Serializer.js';

/**
 * Serializes one or more ExtractionRecord instances into plain data objects.
 * @augments Serializer
 * @author darthjee
 */
class ExtractionSerializer extends Serializer {
  /**
   * Serializes a single ExtractionRecord instance.
   *
   * @param {import('../utils/extractions/ExtractionRecord.js').ExtractionRecord} record - The extraction record to serialize.
   * @returns {{ id: number, parserType: string, originUrl: (string|null), itemCount: number, timestamp: string }} Plain object representation of the extraction record.
   */
  static _serializeObject(record) {
    return {
      id: record.id,
      parserType: record.parserType,
      originUrl: record.originUrl,
      itemCount: record.itemCount,
      timestamp: record.timestamp.toISOString(),
    };
  }
}

export { ExtractionSerializer };
