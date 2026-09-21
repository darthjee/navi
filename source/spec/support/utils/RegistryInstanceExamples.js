/**
 * Shared examples for the scenarios common to the store-backed registry
 * instances (`EmissionRegistryInstance`, `ExtractionRegistryInstance`).
 *
 * Each method registers `it` blocks in the `describe` that is currently being
 * defined, so it must be called from inside the caller's `describe` (and the
 * resulting spec names read exactly as if they had been written inline). The
 * instance under test is received through a getter so the value built in the
 * caller's `beforeEach` is the one used. Recording, counters and `#clear`
 * differ per class and stay in the caller's spec file.
 */
class RegistryInstanceExamples {
  /**
   * Registers the constructor specs (store class, default and custom retention).
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getInstance - Returns an instance built with the defaults.
   * @param {function(new: object, object=)} params.InstanceClass - The registry instance class.
   * @param {function(new: object)} params.StoreClass - The store class the instance must create.
   */
  static constructorExamples({ getInstance, InstanceClass, StoreClass }) {
    it(`creates an ${StoreClass.name}`, () => {
      expect(getInstance().store).toBeInstanceOf(StoreClass);
    });

    it('defaults the store retention to 100', () => {
      expect(getInstance().store.retention).toBe(100);
    });

    it('forwards a custom retention to the store', () => {
      expect(new InstanceClass({ retention: 25 }).store.retention).toBe(25);
    });
  }

  /**
   * Registers the specs for `#getRecords`.
   * Must be called inside a `describe` whose `beforeEach` adds three records
   * keyed `'a'`, `'b'` and `'c'` (in that order) to the instance.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getInstance - Returns the populated instance.
   * @param {string} params.keyField - Identifying field of the records (`itemRef` / `originUrl`).
   */
  static getRecordsExamples({ getInstance, keyField }) {
    it('returns all records oldest-first', () => {
      expect(getInstance().getRecords().map(r => r[keyField])).toEqual(['a', 'b', 'c']);
    });

    it('filters to records newer than lastId', () => {
      const instance = getInstance();
      const firstId = instance.getRecords()[0].id;
      expect(instance.getRecords({ lastId: firstId }).map(r => r[keyField])).toEqual(['b', 'c']);
    });

    it('returns an empty array when lastId is not found', () => {
      expect(getInstance().getRecords({ lastId: 9999 })).toEqual([]);
    });
  }

  /**
   * Registers the specs for `#getRecordById`.
   * @param {object} params - Example parameters.
   * @param {function(): object} params.getInstance - Returns the (empty) instance under test.
   * @param {function(object): object} params.addRecord - Adds a record to the instance and returns it.
   */
  static getRecordByIdExamples({ getInstance, addRecord }) {
    it('returns the matching record', () => {
      const record = addRecord(getInstance());
      expect(getInstance().getRecordById(record.id)).toBe(record);
    });

    it('returns undefined for an unknown id', () => {
      expect(getInstance().getRecordById(9999)).toBeUndefined();
    });
  }
}

export { RegistryInstanceExamples };
