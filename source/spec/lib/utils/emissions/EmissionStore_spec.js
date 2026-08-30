import { EmissionStore } from '../../../../lib/utils/emissions/EmissionStore.js';

describe('EmissionStore', () => {
  let store;

  const emission = (overrides = {}) => ({
    status: 'success',
    url: 'http://example.com/hook',
    method: 'POST',
    httpStatus: 200,
    error: null,
    itemRef: 'ref',
    ...overrides
  });

  beforeEach(() => {
    store = new EmissionStore();
  });

  describe('constructor', () => {
    it('starts with an empty store', () => {
      expect(store.size).toBe(0);
    });

    it('defaults retention to 100', () => {
      expect(store.retention).toBe(100);
    });

    it('accepts a custom retention', () => {
      expect(new EmissionStore(50).retention).toBe(50);
    });

    it('starts with all counters at zero', () => {
      expect(store.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });

  describe('#recordEmission', () => {
    it('adds a record to the store', () => {
      store.recordEmission(emission());
      expect(store.size).toBe(1);
    });

    it('returns the created record', () => {
      const record = store.recordEmission(emission({ itemRef: 'abc' }));
      expect(record.itemRef).toBe('abc');
    });

    it('forwards extractionId to the record', () => {
      const record = store.recordEmission(emission({ extractionId: 42 }));
      expect(record.extractionId).toBe(42);
    });

    it('defaults extractionId to null when omitted', () => {
      const record = store.recordEmission(emission());
      expect(record.extractionId).toBeNull();
    });

    it('assigns incremental IDs starting at 1', () => {
      const first = store.recordEmission(emission());
      const second = store.recordEmission(emission());
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it('increments the emitted counter for a success', () => {
      store.recordEmission(emission({ status: 'success' }));
      expect(store.counts.emitted).toBe(1);
    });

    it('increments the failed counter for a failure', () => {
      store.recordEmission(emission({ status: 'failed' }));
      expect(store.counts.failed).toBe(1);
    });

    it('increments the dead counter for a terminal failure', () => {
      store.recordEmission(emission({ status: 'dead' }));
      expect(store.counts.dead).toBe(1);
    });

    it('does not re-increment failed for a dead emission', () => {
      store.recordEmission(emission({ status: 'dead' }));
      expect(store.counts.failed).toBe(0);
    });

    describe('when retention limit is reached', () => {
      let smallStore;

      beforeEach(() => {
        smallStore = new EmissionStore(3);
        smallStore.recordEmission(emission({ itemRef: '1' }));
        smallStore.recordEmission(emission({ itemRef: '2' }));
        smallStore.recordEmission(emission({ itemRef: '3' }));
      });

      it('does not exceed the retention limit', () => {
        smallStore.recordEmission(emission({ itemRef: '4' }));
        expect(smallStore.size).toBe(3);
      });

      it('removes the oldest record', () => {
        smallStore.recordEmission(emission({ itemRef: '4' }));
        expect(smallStore.getRecords()[0].itemRef).toBe('2');
      });

      it('keeps the newest record', () => {
        smallStore.recordEmission(emission({ itemRef: '4' }));
        const records = smallStore.getRecords();
        expect(records[records.length - 1].itemRef).toBe('4');
      });

      it('keeps counters exact past retention', () => {
        smallStore.recordEmission(emission({ itemRef: '4' }));
        expect(smallStore.counts.emitted).toBe(4);
      });
    });
  });

  describe('#incExtracted', () => {
    it('increments by 1 by default', () => {
      store.incExtracted();
      expect(store.counts.extracted).toBe(1);
    });

    it('increments by the given amount', () => {
      store.incExtracted(5);
      expect(store.counts.extracted).toBe(5);
    });

    it('does not create a record', () => {
      store.incExtracted(3);
      expect(store.size).toBe(0);
    });
  });

  describe('#getRecords', () => {
    it('returns an empty array when store is empty', () => {
      expect(store.getRecords()).toEqual([]);
    });

    it('returns records oldest-first', () => {
      store.recordEmission(emission({ itemRef: 'a' }));
      store.recordEmission(emission({ itemRef: 'b' }));
      expect(store.getRecords().map(r => r.itemRef)).toEqual(['a', 'b']);
    });

    it('returns a copy of the records array', () => {
      store.recordEmission(emission());
      store.getRecords().push('extra');
      expect(store.size).toBe(1);
    });
  });

  describe('#getRecordById', () => {
    it('returns the record with the matching ID', () => {
      const added = store.recordEmission(emission());
      expect(store.getRecordById(added.id)).toBe(added);
    });

    it('returns undefined when no record has the given ID', () => {
      expect(store.getRecordById(999)).toBeUndefined();
    });
  });

  describe('#clear', () => {
    beforeEach(() => {
      store.recordEmission(emission({ status: 'success' }));
      store.recordEmission(emission({ status: 'failed' }));
      store.incExtracted(2);
      store.clear();
    });

    it('removes all records', () => {
      expect(store.size).toBe(0);
    });

    it('results in an empty getRecords', () => {
      expect(store.getRecords()).toEqual([]);
    });

    it('resets all counters to zero', () => {
      expect(store.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });

  describe('#size', () => {
    it('returns 0 for an empty store', () => {
      expect(store.size).toBe(0);
    });

    it('returns the number of records in the store', () => {
      store.recordEmission(emission());
      store.recordEmission(emission());
      expect(store.size).toBe(2);
    });
  });

  describe('#retention', () => {
    it('returns the configured retention limit', () => {
      expect(new EmissionStore(25).retention).toBe(25);
    });
  });

  describe('#counts', () => {
    it('returns a copy that does not affect the store when mutated', () => {
      const counts = store.counts;
      counts.emitted = 999;
      expect(store.counts.emitted).toBe(0);
    });
  });

  describe('#toJSON', () => {
    it('returns counts and an empty records array when store is empty', () => {
      expect(store.toJSON()).toEqual({
        counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 },
        records: []
      });
    });

    it('returns records as plain objects oldest-first', () => {
      store.recordEmission(emission({ itemRef: 'a' }));
      store.recordEmission(emission({ itemRef: 'b' }));
      const json = store.toJSON();
      expect(json.records.map(r => r.itemRef)).toEqual(['a', 'b']);
      expect(typeof json.records[0].timestamp).toBe('string');
    });

    it('includes the current counters', () => {
      store.recordEmission(emission({ status: 'success' }));
      store.incExtracted(3);
      expect(store.toJSON().counts).toEqual({
        extracted: 3, emitted: 1, failed: 0, dead: 0
      });
    });
  });
});
