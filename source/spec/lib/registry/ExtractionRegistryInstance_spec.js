import { ExtractionRegistryInstance } from '../../../lib/registry/ExtractionRegistryInstance.js';
import { ExtractionStore } from '../../../lib/utils/extractions/ExtractionStore.js';

describe('ExtractionRegistryInstance', () => {
  let instance;

  const extraction = (overrides = {}) => ({
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 10,
    ...overrides
  });

  beforeEach(() => {
    instance = new ExtractionRegistryInstance();
  });

  describe('constructor', () => {
    it('creates an ExtractionStore', () => {
      expect(instance.store).toBeInstanceOf(ExtractionStore);
    });

    it('defaults the store retention to 100', () => {
      expect(instance.store.retention).toBe(100);
    });

    it('forwards a custom retention to the store', () => {
      expect(new ExtractionRegistryInstance({ retention: 25 }).store.retention).toBe(25);
    });
  });

  describe('#recordExtraction', () => {
    it('delegates to the store and returns the record', () => {
      const record = instance.recordExtraction(extraction({ parserType: 'regex' }));
      expect(record.parserType).toBe('regex');
    });

    it('adds the itemCount to the extracted counter', () => {
      instance.recordExtraction(extraction({ itemCount: 4 }));
      expect(instance.counts.extracted).toBe(4);
    });
  });

  describe('#getRecords', () => {
    beforeEach(() => {
      instance.recordExtraction(extraction({ originUrl: 'a' }));
      instance.recordExtraction(extraction({ originUrl: 'b' }));
      instance.recordExtraction(extraction({ originUrl: 'c' }));
    });

    it('returns all records oldest-first', () => {
      expect(instance.getRecords().map(r => r.originUrl)).toEqual(['a', 'b', 'c']);
    });

    it('filters to records newer than lastId', () => {
      const firstId = instance.getRecords()[0].id;
      expect(instance.getRecords({ lastId: firstId }).map(r => r.originUrl)).toEqual(['b', 'c']);
    });

    it('returns an empty array when lastId is not found', () => {
      expect(instance.getRecords({ lastId: 9999 })).toEqual([]);
    });
  });

  describe('#getRecordById', () => {
    it('returns the matching record', () => {
      const record = instance.recordExtraction(extraction());
      expect(instance.getRecordById(record.id)).toBe(record);
    });

    it('returns undefined for an unknown id', () => {
      expect(instance.getRecordById(9999)).toBeUndefined();
    });
  });

  describe('#counts', () => {
    it('returns the store counters', () => {
      instance.recordExtraction(extraction({ itemCount: 2 }));
      expect(instance.counts).toEqual({ extracted: 2 });
    });
  });

  describe('#clear', () => {
    it('clears records and counters', () => {
      instance.recordExtraction(extraction({ itemCount: 3 }));
      instance.clear();
      expect(instance.getRecords()).toEqual([]);
      expect(instance.counts).toEqual({ extracted: 0 });
    });
  });
});
