/**
 * Shared examples for the scenarios common to the bounded record stores
 * (`EmissionStore`, `ExtractionStore`).
 *
 * Each method registers `it` blocks in the `describe` that is currently being
 * defined, so it must be called from inside the caller's `describe` (and the
 * resulting spec names read exactly as if they had been written inline). The
 * store under test is received through a getter so the value built in the
 * caller's `beforeEach` is the one used. Anything class-specific (counter
 * contents, `recordEmission` / `recordExtraction`, ...) stays in the caller's
 * spec file.
 *
 * Every method receives the same `params` object, from which it only reads
 * the entries it needs:
 * - `getStore`: `function(): object`, returns the store under test.
 * - `buildStore`: `function(number=): object`, builds a new store with the given retention.
 * - `addRecord`: `function(object, string=): object`, adds a record to the given store
 *   using the key as its identifying field, and returns the created record.
 * - `keyField`: `string`, the identifying field of the records (`itemRef` / `originUrl`).
 */
class StoreExamples {
  /**
   * Registers the specs for the constructor defaults.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns a store built with the defaults.
   * @param {function(number): object} params.buildStore - Builds a store with the given retention.
   */
  static constructorExamples({ getStore, buildStore }) {
    it('starts with an empty store', () => {
      expect(getStore().size).toBe(0);
    });

    it('defaults retention to 100', () => {
      expect(getStore().retention).toBe(100);
    });

    it('accepts a custom retention', () => {
      expect(buildStore(50).retention).toBe(50);
    });
  }

  /**
   * Registers the specs for the eviction when the retention limit is reached.
   * Must be called inside a `describe` whose `beforeEach` fills a store of
   * size 3 with the records `'1'`, `'2'` and `'3'`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the full store of size 3.
   * @param {function(object, string): object} params.addRecord - Adds a record keyed by the string.
   * @param {string} params.keyField - Identifying field of the records.
   */
  static retentionLimitExamples({ getStore, addRecord, keyField }) {
    it('does not exceed the retention limit', () => {
      addRecord(getStore(), '4');
      expect(getStore().size).toBe(3);
    });

    it('removes the oldest record', () => {
      addRecord(getStore(), '4');
      expect(getStore().getRecords()[0][keyField]).toBe('2');
    });

    it('keeps the newest record', () => {
      addRecord(getStore(), '4');
      const records = getStore().getRecords();
      expect(records[records.length - 1][keyField]).toBe('4');
    });
  }

  /**
   * Registers the specs for `#getRecords`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the (empty) store under test.
   * @param {function(object, string=): object} params.addRecord - Adds a record keyed by the string.
   * @param {string} params.keyField - Identifying field of the records.
   */
  static getRecordsExamples({ getStore, addRecord, keyField }) {
    it('returns an empty array when store is empty', () => {
      expect(getStore().getRecords()).toEqual([]);
    });

    it('returns records oldest-first', () => {
      addRecord(getStore(), 'a');
      addRecord(getStore(), 'b');
      expect(getStore().getRecords().map(r => r[keyField])).toEqual(['a', 'b']);
    });

    it('returns a copy of the records array', () => {
      addRecord(getStore());
      getStore().getRecords().push('extra');
      expect(getStore().size).toBe(1);
    });
  }

  /**
   * Registers the specs for `#getRecordById`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the (empty) store under test.
   * @param {function(object, string=): object} params.addRecord - Adds a record and returns it.
   */
  static getRecordByIdExamples({ getStore, addRecord }) {
    it('returns the record with the matching ID', () => {
      const added = addRecord(getStore());
      expect(getStore().getRecordById(added.id)).toBe(added);
    });

    it('returns undefined when no record has the given ID', () => {
      expect(getStore().getRecordById(999)).toBeUndefined();
    });
  }

  /**
   * Registers the specs for the records side of `#clear`.
   * Must be called inside a `describe` whose `beforeEach` populates the store
   * and then clears it. The counter reset spec stays in the caller.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the cleared store.
   */
  static clearExamples({ getStore }) {
    it('removes all records', () => {
      expect(getStore().size).toBe(0);
    });

    it('results in an empty getRecords', () => {
      expect(getStore().getRecords()).toEqual([]);
    });
  }

  /**
   * Registers the specs for `#size`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the (empty) store under test.
   * @param {function(object, string=): object} params.addRecord - Adds a record.
   */
  static sizeExamples({ getStore, addRecord }) {
    it('returns 0 for an empty store', () => {
      expect(getStore().size).toBe(0);
    });

    it('returns the number of records in the store', () => {
      addRecord(getStore());
      addRecord(getStore());
      expect(getStore().size).toBe(2);
    });
  }

  /**
   * Registers the specs for `#retention`.
   * @param {object} params - Example parameters.
   * @param {function(number): object} params.buildStore - Builds a store with the given retention.
   */
  static retentionExamples({ buildStore }) {
    it('returns the configured retention limit', () => {
      expect(buildStore(25).retention).toBe(25);
    });
  }

  /**
   * Registers the spec asserting `#counts` returns a copy.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the (empty) store under test.
   * @param {string} params.counterKey - A counter key present in `counts` (`emitted` / `extracted`).
   */
  static countsCopyExamples({ getStore, counterKey }) {
    it('returns a copy that does not affect the store when mutated', () => {
      const counts = getStore().counts;
      counts[counterKey] = 999;
      expect(getStore().counts[counterKey]).toBe(0);
    });
  }

  /**
   * Registers the spec for the records listed by `#toJSON`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getStore - Returns the (empty) store under test.
   * @param {function(object, string=): object} params.addRecord - Adds a record keyed by the string.
   * @param {string} params.keyField - Identifying field of the records.
   */
  static toJSONRecordsExamples({ getStore, addRecord, keyField }) {
    it('returns records as plain objects oldest-first', () => {
      addRecord(getStore(), 'a');
      addRecord(getStore(), 'b');
      const json = getStore().toJSON();
      expect(json.records.map(r => r[keyField])).toEqual(['a', 'b']);
      expect(typeof json.records[0].timestamp).toBe('string');
    });
  }
}

export { StoreExamples };
