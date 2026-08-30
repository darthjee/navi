import { ExtractionStore } from '../../../../lib/utils/extractions/ExtractionStore.js';

describe('ExtractionStore', () => {
  let store;

  const extraction = (overrides = {}) => ({
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 10,
    ...overrides
  });

  beforeEach(() => {
    store = new ExtractionStore();
  });

  describe('constructor', () => {
    it('starts with an empty store', () => {
      expect(store.size).toBe(0);
    });

    it('defaults retention to 100', () => {
      expect(store.retention).toBe(100);
    });

    it('accepts a custom retention', () => {
      expect(new ExtractionStore(50).retention).toBe(50);
    });

    it('starts with the extracted counter at zero', () => {
      expect(store.counts).toEqual({ extracted: 0 });
    });
  });

  describe('#recordExtraction', () => {
    it('adds a record to the store', () => {
      store.recordExtraction(extraction());
      expect(store.size).toBe(1);
    });

    it('returns the created record', () => {
      const record = store.recordExtraction(extraction({ parserType: 'regex' }));
      expect(record.parserType).toBe('regex');
    });

    it('assigns incremental IDs starting at 1', () => {
      const first = store.recordExtraction(extraction());
      const second = store.recordExtraction(extraction());
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it('adds the itemCount to the extracted counter', () => {
      store.recordExtraction(extraction({ itemCount: 7 }));
      store.recordExtraction(extraction({ itemCount: 3 }));
      expect(store.counts.extracted).toBe(10);
    });

    describe('when retention limit is reached', () => {
      let smallStore;

      beforeEach(() => {
        smallStore = new ExtractionStore(3);
        smallStore.recordExtraction(extraction({ originUrl: '1' }));
        smallStore.recordExtraction(extraction({ originUrl: '2' }));
        smallStore.recordExtraction(extraction({ originUrl: '3' }));
      });

      it('does not exceed the retention limit', () => {
        smallStore.recordExtraction(extraction({ originUrl: '4' }));
        expect(smallStore.size).toBe(3);
      });

      it('removes the oldest record', () => {
        smallStore.recordExtraction(extraction({ originUrl: '4' }));
        expect(smallStore.getRecords()[0].originUrl).toBe('2');
      });

      it('keeps the newest record', () => {
        smallStore.recordExtraction(extraction({ originUrl: '4' }));
        const records = smallStore.getRecords();
        expect(records[records.length - 1].originUrl).toBe('4');
      });

      it('keeps the extracted counter exact past retention', () => {
        smallStore.recordExtraction(extraction({ originUrl: '4', itemCount: 10 }));
        expect(smallStore.counts.extracted).toBe(40);
      });
    });
  });

  describe('#getRecords', () => {
    it('returns an empty array when store is empty', () => {
      expect(store.getRecords()).toEqual([]);
    });

    it('returns records oldest-first', () => {
      store.recordExtraction(extraction({ originUrl: 'a' }));
      store.recordExtraction(extraction({ originUrl: 'b' }));
      expect(store.getRecords().map(r => r.originUrl)).toEqual(['a', 'b']);
    });

    it('returns a copy of the records array', () => {
      store.recordExtraction(extraction());
      store.getRecords().push('extra');
      expect(store.size).toBe(1);
    });
  });

  describe('#getRecordById', () => {
    it('returns the record with the matching ID', () => {
      const added = store.recordExtraction(extraction());
      expect(store.getRecordById(added.id)).toBe(added);
    });

    it('returns undefined when no record has the given ID', () => {
      expect(store.getRecordById(999)).toBeUndefined();
    });
  });

  describe('#clear', () => {
    beforeEach(() => {
      store.recordExtraction(extraction({ itemCount: 2 }));
      store.recordExtraction(extraction({ itemCount: 3 }));
      store.clear();
    });

    it('removes all records', () => {
      expect(store.size).toBe(0);
    });

    it('results in an empty getRecords', () => {
      expect(store.getRecords()).toEqual([]);
    });

    it('resets the extracted counter to zero', () => {
      expect(store.counts).toEqual({ extracted: 0 });
    });
  });

  describe('#size', () => {
    it('returns 0 for an empty store', () => {
      expect(store.size).toBe(0);
    });

    it('returns the number of records in the store', () => {
      store.recordExtraction(extraction());
      store.recordExtraction(extraction());
      expect(store.size).toBe(2);
    });
  });

  describe('#retention', () => {
    it('returns the configured retention limit', () => {
      expect(new ExtractionStore(25).retention).toBe(25);
    });
  });

  describe('#counts', () => {
    it('returns a copy that does not affect the store when mutated', () => {
      const counts = store.counts;
      counts.extracted = 999;
      expect(store.counts.extracted).toBe(0);
    });
  });

  describe('#toJSON', () => {
    it('returns counts and an empty records array when store is empty', () => {
      expect(store.toJSON()).toEqual({
        counts: { extracted: 0 },
        records: []
      });
    });

    it('returns records as plain objects oldest-first', () => {
      store.recordExtraction(extraction({ originUrl: 'a' }));
      store.recordExtraction(extraction({ originUrl: 'b' }));
      const json = store.toJSON();
      expect(json.records.map(r => r.originUrl)).toEqual(['a', 'b']);
      expect(typeof json.records[0].timestamp).toBe('string');
    });

    it('includes the current counters', () => {
      store.recordExtraction(extraction({ itemCount: 3 }));
      expect(store.toJSON().counts).toEqual({ extracted: 3 });
    });
  });
});
