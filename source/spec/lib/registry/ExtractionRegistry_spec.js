import { ExtractionRegistry } from '../../../lib/registry/ExtractionRegistry.js';
import { ExtractionRegistryInstance } from '../../../lib/registry/ExtractionRegistryInstance.js';

describe('ExtractionRegistry', () => {
  const extraction = (overrides = {}) => ({
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 10,
    ...overrides
  });

  afterEach(() => {
    ExtractionRegistry.reset();
  });

  describe('.build', () => {
    it('returns an ExtractionRegistryInstance', () => {
      expect(ExtractionRegistry.build()).toBeInstanceOf(ExtractionRegistryInstance);
    });

    it('forwards options to the instance', () => {
      expect(ExtractionRegistry.build({ retention: 10 }).store.retention).toBe(10);
    });

    it('throws if called twice without reset', () => {
      ExtractionRegistry.build();
      expect(() => ExtractionRegistry.build()).toThrowError(/already been called/);
    });
  });

  describe('.reset', () => {
    it('allows build to be called again', () => {
      ExtractionRegistry.build();
      ExtractionRegistry.reset();
      expect(() => ExtractionRegistry.build()).not.toThrow();
    });
  });

  describe('.recordExtraction', () => {
    it('silently no-ops when the registry has not been built', () => {
      expect(() => ExtractionRegistry.recordExtraction(extraction())).not.toThrow();
    });

    it('returns undefined when the registry has not been built', () => {
      expect(ExtractionRegistry.recordExtraction(extraction())).toBeUndefined();
    });

    it('delegates to the instance once built', () => {
      ExtractionRegistry.build();
      ExtractionRegistry.recordExtraction(extraction({ itemCount: 5 }));
      expect(ExtractionRegistry.counts.extracted).toBe(5);
    });

    it('returns the created record once built', () => {
      ExtractionRegistry.build();
      const record = ExtractionRegistry.recordExtraction(extraction());
      expect(record.id).toBe(1);
    });
  });

  describe('.getRecords', () => {
    it('throws when the registry has not been built', () => {
      expect(() => ExtractionRegistry.getRecords()).toThrowError(/not been built/);
    });

    it('returns records once built', () => {
      ExtractionRegistry.build();
      ExtractionRegistry.recordExtraction(extraction({ originUrl: 'a' }));
      ExtractionRegistry.recordExtraction(extraction({ originUrl: 'b' }));
      expect(ExtractionRegistry.getRecords().map(r => r.originUrl)).toEqual(['a', 'b']);
    });

    it('filters by lastId', () => {
      ExtractionRegistry.build();
      ExtractionRegistry.recordExtraction(extraction({ originUrl: 'a' }));
      ExtractionRegistry.recordExtraction(extraction({ originUrl: 'b' }));
      const firstId = ExtractionRegistry.getRecords()[0].id;
      expect(ExtractionRegistry.getRecords({ lastId: firstId }).map(r => r.originUrl)).toEqual(['b']);
    });
  });

  describe('.getRecordById', () => {
    it('throws when the registry has not been built', () => {
      expect(() => ExtractionRegistry.getRecordById(1)).toThrowError(/not been built/);
    });

    it('returns the matching record once built', () => {
      const instance = ExtractionRegistry.build();
      const record = instance.recordExtraction(extraction());
      expect(ExtractionRegistry.getRecordById(record.id)).toBe(record);
    });
  });

  describe('.counts', () => {
    it('throws when the registry has not been built', () => {
      expect(() => ExtractionRegistry.counts).toThrowError(/not been built/);
    });

    it('returns the counters once built', () => {
      ExtractionRegistry.build();
      ExtractionRegistry.recordExtraction(extraction({ itemCount: 2 }));
      expect(ExtractionRegistry.counts).toEqual({ extracted: 2 });
    });
  });

  describe('.clear', () => {
    it('throws when the registry has not been built', () => {
      expect(() => ExtractionRegistry.clear()).toThrowError(/not been built/);
    });

    it('clears records and counters once built', () => {
      ExtractionRegistry.build();
      ExtractionRegistry.recordExtraction(extraction({ itemCount: 3 }));
      ExtractionRegistry.clear();
      expect(ExtractionRegistry.getRecords()).toEqual([]);
      expect(ExtractionRegistry.counts).toEqual({ extracted: 0 });
    });
  });
});
