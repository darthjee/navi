import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { EmissionRegistryInstance } from '../../../lib/registry/EmissionRegistryInstance.js';

describe('EmissionRegistry', () => {
  const emission = (overrides = {}) => ({
    status: 'success',
    url: 'http://example.com/hook',
    method: 'POST',
    httpStatus: 200,
    error: null,
    itemRef: 'ref',
    ...overrides
  });

  afterEach(() => {
    EmissionRegistry.reset();
  });

  describe('.build', () => {
    it('returns an EmissionRegistryInstance', () => {
      expect(EmissionRegistry.build()).toBeInstanceOf(EmissionRegistryInstance);
    });

    it('forwards options to the instance', () => {
      expect(EmissionRegistry.build({ retention: 10 }).store.retention).toBe(10);
    });

    it('throws if called twice without reset', () => {
      EmissionRegistry.build();
      expect(() => EmissionRegistry.build()).toThrowError(/already been called/);
    });
  });

  describe('.reset', () => {
    it('allows build to be called again', () => {
      EmissionRegistry.build();
      EmissionRegistry.reset();
      expect(() => EmissionRegistry.build()).not.toThrow();
    });
  });

  describe('.incExtracted', () => {
    it('silently no-ops when the registry has not been built', () => {
      expect(() => EmissionRegistry.incExtracted(3)).not.toThrow();
    });

    it('delegates to the instance once built', () => {
      EmissionRegistry.build();
      EmissionRegistry.incExtracted(3);
      expect(EmissionRegistry.counts.extracted).toBe(3);
    });
  });

  describe('.recordEmission', () => {
    it('silently no-ops when the registry has not been built', () => {
      expect(() => EmissionRegistry.recordEmission(emission())).not.toThrow();
    });

    it('delegates to the instance once built', () => {
      EmissionRegistry.build();
      EmissionRegistry.recordEmission(emission({ status: 'failed' }));
      expect(EmissionRegistry.counts.failed).toBe(1);
    });
  });

  describe('.getRecords', () => {
    it('throws when the registry has not been built', () => {
      expect(() => EmissionRegistry.getRecords()).toThrowError(/not been built/);
    });

    it('returns records once built', () => {
      EmissionRegistry.build();
      EmissionRegistry.recordEmission(emission({ itemRef: 'a' }));
      EmissionRegistry.recordEmission(emission({ itemRef: 'b' }));
      expect(EmissionRegistry.getRecords().map(r => r.itemRef)).toEqual(['a', 'b']);
    });

    it('filters by lastId', () => {
      EmissionRegistry.build();
      EmissionRegistry.recordEmission(emission({ itemRef: 'a' }));
      EmissionRegistry.recordEmission(emission({ itemRef: 'b' }));
      const firstId = EmissionRegistry.getRecords()[0].id;
      expect(EmissionRegistry.getRecords({ lastId: firstId }).map(r => r.itemRef)).toEqual(['b']);
    });
  });

  describe('.getRecordById', () => {
    it('throws when the registry has not been built', () => {
      expect(() => EmissionRegistry.getRecordById(1)).toThrowError(/not been built/);
    });

    it('returns the matching record once built', () => {
      const instance = EmissionRegistry.build();
      const record = instance.recordEmission(emission());
      expect(EmissionRegistry.getRecordById(record.id)).toBe(record);
    });
  });

  describe('.counts', () => {
    it('throws when the registry has not been built', () => {
      expect(() => EmissionRegistry.counts).toThrowError(/not been built/);
    });

    it('returns the counters once built', () => {
      EmissionRegistry.build();
      EmissionRegistry.incExtracted(2);
      expect(EmissionRegistry.counts).toEqual({ extracted: 2, emitted: 0, failed: 0, dead: 0 });
    });
  });

  describe('.clear', () => {
    it('throws when the registry has not been built', () => {
      expect(() => EmissionRegistry.clear()).toThrowError(/not been built/);
    });

    it('clears records and counters once built', () => {
      EmissionRegistry.build();
      EmissionRegistry.recordEmission(emission());
      EmissionRegistry.incExtracted(3);
      EmissionRegistry.clear();
      expect(EmissionRegistry.getRecords()).toEqual([]);
      expect(EmissionRegistry.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });
});
