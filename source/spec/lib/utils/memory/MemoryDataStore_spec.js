import { MemoryDataStore } from '../../../../lib/utils/memory/MemoryDataStore.js';

describe('MemoryDataStore', () => {
  let store;

  beforeEach(() => {
    store = new MemoryDataStore();
  });

  describe('constructor', () => {
    it('starts with an empty store', () => {
      expect(store.size).toBe(0);
    });

    it('defaults retention to 100', () => {
      expect(store.retention).toBe(100);
    });

    it('accepts a custom retention', () => {
      const customStore = new MemoryDataStore(50);
      expect(customStore.retention).toBe(50);
    });
  });

  describe('#add', () => {
    it('adds an entry to the store', () => {
      store.add(1024, 12.5);
      expect(store.size).toBe(1);
    });

    it('returns the created entry', () => {
      const entry = store.add(1024, 12.5);
      expect(entry.value).toBe(1024);
      expect(entry.percentage).toBe(12.5);
    });

    it('assigns incremental IDs starting at 1', () => {
      const first = store.add(1024, 10.0);
      const second = store.add(2048, 20.0);
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    describe('when retention limit is reached', () => {
      let smallStore;

      beforeEach(() => {
        smallStore = new MemoryDataStore(3);
        smallStore.add(1, 1.0);
        smallStore.add(2, 2.0);
        smallStore.add(3, 3.0);
      });

      it('does not exceed the retention limit', () => {
        smallStore.add(4, 4.0);
        expect(smallStore.size).toBe(3);
      });

      it('removes the oldest entry', () => {
        smallStore.add(4, 4.0);
        const entries = smallStore.getEntries();
        expect(entries[0].value).toBe(2);
      });

      it('keeps the newest entries', () => {
        smallStore.add(4, 4.0);
        const entries = smallStore.getEntries();
        expect(entries[entries.length - 1].value).toBe(4);
      });
    });
  });

  describe('#getEntries', () => {
    it('returns an empty array when store is empty', () => {
      expect(store.getEntries()).toEqual([]);
    });

    it('returns all entries', () => {
      store.add(1, 1.0);
      store.add(2, 2.0);
      expect(store.getEntries().length).toBe(2);
    });

    it('returns a copy of the entries array', () => {
      store.add(1, 1.0);
      const entries = store.getEntries();
      entries.push('extra');
      expect(store.size).toBe(1);
    });
  });

  describe('#getEntryById', () => {
    it('returns the entry with the matching ID', () => {
      const added = store.add(1024, 12.5);
      const found = store.getEntryById(added.id);
      expect(found).toBe(added);
    });

    it('returns undefined when no entry has the given ID', () => {
      expect(store.getEntryById(999)).toBeUndefined();
    });
  });

  describe('#clear', () => {
    it('removes all entries from the store', () => {
      store.add(1, 1.0);
      store.add(2, 2.0);
      store.clear();
      expect(store.size).toBe(0);
    });

    it('results in an empty getEntries', () => {
      store.add(1, 1.0);
      store.clear();
      expect(store.getEntries()).toEqual([]);
    });
  });

  describe('#size', () => {
    it('returns 0 for an empty store', () => {
      expect(store.size).toBe(0);
    });

    it('returns the number of entries in the store', () => {
      store.add(1, 1.0);
      store.add(2, 2.0);
      expect(store.size).toBe(2);
    });
  });

  describe('#retention', () => {
    it('returns the configured retention limit', () => {
      const customStore = new MemoryDataStore(25);
      expect(customStore.retention).toBe(25);
    });
  });

  describe('#toJSON', () => {
    it('returns an empty array when store is empty', () => {
      expect(store.toJSON()).toEqual([]);
    });

    it('returns an array of plain objects', () => {
      store.add(1024, 12.5);
      const json = store.toJSON();
      expect(json.length).toBe(1);
      expect(json[0].id).toBe(1);
      expect(json[0].value).toBe(1024);
      expect(json[0].percentage).toBe(12.5);
      expect(typeof json[0].timestamp).toBe('string');
    });
  });
});
