import { MemoryRegistryInstance } from '../../../lib/registry/MemoryRegistryInstance.js';
import { MemoryDataStore } from '../../../lib/utils/memory/MemoryDataStore.js';

describe('MemoryRegistryInstance', () => {
  let instance;

  beforeEach(() => {
    instance = new MemoryRegistryInstance();
  });

  describe('constructor', () => {
    it('creates a MemoryDataStore', () => {
      expect(instance.store).toBeInstanceOf(MemoryDataStore);
    });

    it('defaults the store retention to 100', () => {
      expect(instance.store.retention).toBe(100);
    });

    it('forwards a custom retention to the store', () => {
      expect(new MemoryRegistryInstance({ retention: 25 }).store.retention).toBe(25);
    });
  });

  describe('#add', () => {
    it('delegates to the store and returns the created entry', () => {
      const entry = instance.add(1024, 10);
      expect(entry.value).toBe(1024);
      expect(entry.percentage).toBe(10);
    });

    it('is reflected in getEntries', () => {
      instance.add(1024, 10);
      expect(instance.getEntries().map(e => e.value)).toEqual([1024]);
    });
  });

  describe('#getEntries', () => {
    beforeEach(() => {
      instance.add(100, 1);
      instance.add(200, 2);
      instance.add(300, 3);
    });

    it('returns all entries oldest-first', () => {
      expect(instance.getEntries().map(e => e.value)).toEqual([100, 200, 300]);
    });

    it('filters to entries newer than lastId', () => {
      const firstId = instance.getEntries()[0].id;
      expect(instance.getEntries({ lastId: firstId }).map(e => e.value)).toEqual([200, 300]);
    });

    it('returns an empty array when lastId is not found', () => {
      expect(instance.getEntries({ lastId: 9999 })).toEqual([]);
    });

    it('returns an empty array when lastId has aged out of the retention window', () => {
      const small = new MemoryRegistryInstance({ retention: 1 });
      small.add(100, 1);
      const firstId = small.getEntries()[0].id;
      small.add(200, 2);
      expect(small.getEntries({ lastId: firstId })).toEqual([]);
    });
  });
});
