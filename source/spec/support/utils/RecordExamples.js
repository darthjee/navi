/**
 * Shared examples for the scenarios common to the store record classes
 * (`EmissionRecord`, `ExtractionRecord`).
 *
 * Each method registers `it` blocks in the `describe` that is currently being
 * defined, so it must be called from inside the caller's `describe` (and the
 * resulting spec names read exactly as if they had been written inline). The
 * record under test is received through a getter so the value built in the
 * caller's `beforeEach` is the one used. Per-field scenarios and the defaults
 * of omitted optional fields differ per class and stay in the caller's spec
 * file.
 */
class RecordExamples {
  /**
   * Registers the constructor specs for the `id` and the `timestamp`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getRecord - Returns the record under test.
   * @param {number} params.expectedId - The id the record was built with.
   */
  static constructorExamples({ getRecord, expectedId }) {
    it('creates a record with the given id', () => {
      expect(getRecord().id).toBe(expectedId);
    });

    it('creates a record with a timestamp', () => {
      expect(getRecord().timestamp).toBeInstanceOf(Date);
    });
  }

  /**
   * Registers the spec asserting the timestamp is taken at construction time.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.buildRecord - Builds a new minimal record.
   */
  static timestampExamples({ buildRecord }) {
    it('returns a Date created at construction time', () => {
      const before = new Date();
      const anotherRecord = buildRecord();
      const after = new Date();

      expect(anotherRecord.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(anotherRecord.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  }

  /**
   * Registers the `#toJSON` specs for the `id` and the ISO `timestamp`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getRecord - Returns the record under test.
   * @param {number} params.expectedId - The id the record was built with.
   */
  static toJSONExamples({ getRecord, expectedId }) {
    it('returns an object with the record id', () => {
      expect(getRecord().toJSON().id).toBe(expectedId);
    });

    it('returns an object with the timestamp as ISO string', () => {
      const record = getRecord();
      expect(record.toJSON().timestamp).toBe(record.timestamp.toISOString());
    });
  }
}

export { RecordExamples };
