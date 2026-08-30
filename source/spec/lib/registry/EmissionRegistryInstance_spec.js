import { EmissionRegistryInstance } from '../../../lib/registry/EmissionRegistryInstance.js';
import { EmissionStore } from '../../../lib/utils/emissions/EmissionStore.js';

describe('EmissionRegistryInstance', () => {
  let instance;

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
    instance = new EmissionRegistryInstance();
  });

  describe('constructor', () => {
    it('creates an EmissionStore', () => {
      expect(instance.store).toBeInstanceOf(EmissionStore);
    });

    it('defaults the store retention to 100', () => {
      expect(instance.store.retention).toBe(100);
    });

    it('forwards a custom retention to the store', () => {
      expect(new EmissionRegistryInstance({ retention: 25 }).store.retention).toBe(25);
    });
  });

  describe('#incExtracted', () => {
    it('delegates to the store with the default amount', () => {
      instance.incExtracted();
      expect(instance.counts.extracted).toBe(1);
    });

    it('delegates the given amount to the store', () => {
      instance.incExtracted(4);
      expect(instance.counts.extracted).toBe(4);
    });
  });

  describe('#recordEmission', () => {
    it('delegates to the store and returns the record', () => {
      const record = instance.recordEmission(emission({ itemRef: 'abc' }));
      expect(record.itemRef).toBe('abc');
    });

    it('bumps the matching counter', () => {
      instance.recordEmission(emission({ status: 'success' }));
      expect(instance.counts.emitted).toBe(1);
    });
  });

  describe('#getRecords', () => {
    beforeEach(() => {
      instance.recordEmission(emission({ itemRef: 'a' }));
      instance.recordEmission(emission({ itemRef: 'b' }));
      instance.recordEmission(emission({ itemRef: 'c' }));
    });

    it('returns all records oldest-first', () => {
      expect(instance.getRecords().map(r => r.itemRef)).toEqual(['a', 'b', 'c']);
    });

    it('filters to records newer than lastId', () => {
      const firstId = instance.getRecords()[0].id;
      expect(instance.getRecords({ lastId: firstId }).map(r => r.itemRef)).toEqual(['b', 'c']);
    });

    it('returns an empty array when lastId is not found', () => {
      expect(instance.getRecords({ lastId: 9999 })).toEqual([]);
    });
  });

  describe('#getRecordById', () => {
    it('returns the matching record', () => {
      const record = instance.recordEmission(emission());
      expect(instance.getRecordById(record.id)).toBe(record);
    });

    it('returns undefined for an unknown id', () => {
      expect(instance.getRecordById(9999)).toBeUndefined();
    });
  });

  describe('#counts', () => {
    it('returns the store counters', () => {
      instance.incExtracted(2);
      instance.recordEmission(emission({ status: 'failed' }));
      expect(instance.counts).toEqual({ extracted: 2, emitted: 0, failed: 1, dead: 0 });
    });
  });

  describe('#clear', () => {
    it('clears records and counters', () => {
      instance.recordEmission(emission());
      instance.incExtracted(3);
      instance.clear();
      expect(instance.getRecords()).toEqual([]);
      expect(instance.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });
});
