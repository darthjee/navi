import { MemoryRegistry } from '../../../lib/registry/MemoryRegistry.js';
import { MemoryRegistryInstance } from '../../../lib/registry/MemoryRegistryInstance.js';

describe('MemoryRegistry', () => {
  afterEach(() => {
    MemoryRegistry.reset();
  });

  describe('.build', () => {
    it('returns a MemoryRegistryInstance', () => {
      expect(MemoryRegistry.build()).toBeInstanceOf(MemoryRegistryInstance);
    });

    it('forwards retention to the instance', () => {
      expect(MemoryRegistry.build({ retention: 10 }).store.retention).toBe(10);
    });

    it('throws if called twice without reset', () => {
      MemoryRegistry.build();
      expect(() => MemoryRegistry.build()).toThrowError(/already been called/);
    });
  });

  describe('.reset', () => {
    it('allows build to be called again', () => {
      MemoryRegistry.build();
      MemoryRegistry.reset();
      expect(() => MemoryRegistry.build()).not.toThrow();
    });
  });

  describe('.add', () => {
    it('silently no-ops when the registry has not been built', () => {
      expect(() => MemoryRegistry.add(1024, 10)).not.toThrow();
    });

    it('delegates to the instance once built', () => {
      MemoryRegistry.build();
      MemoryRegistry.add(1024, 10);
      expect(MemoryRegistry.getEntries().map(e => e.value)).toEqual([1024]);
    });
  });

  describe('.getEntries', () => {
    it('throws when the registry has not been built', () => {
      expect(() => MemoryRegistry.getEntries()).toThrowError(/not been built/);
    });

    it('returns entries oldest-first once built', () => {
      MemoryRegistry.build();
      MemoryRegistry.add(100, 1);
      MemoryRegistry.add(200, 2);
      expect(MemoryRegistry.getEntries().map(e => e.value)).toEqual([100, 200]);
    });

    it('filters by lastId', () => {
      MemoryRegistry.build();
      MemoryRegistry.add(100, 1);
      MemoryRegistry.add(200, 2);
      const firstId = MemoryRegistry.getEntries()[0].id;
      expect(MemoryRegistry.getEntries({ lastId: firstId }).map(e => e.value)).toEqual([200]);
    });

    it('returns an empty array when lastId has aged out of the retention window', () => {
      MemoryRegistry.build({ retention: 1 });
      MemoryRegistry.add(100, 1);
      const firstId = MemoryRegistry.getEntries()[0].id;
      MemoryRegistry.add(200, 2);
      expect(MemoryRegistry.getEntries({ lastId: firstId })).toEqual([]);
    });
  });
});
