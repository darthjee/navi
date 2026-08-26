import { MemoryData } from '../../../../lib/utils/memory/MemoryData.js';

describe('MemoryData', () => {
  let entry;

  beforeEach(() => {
    entry = new MemoryData(1, 1024, 12.5);
  });

  describe('constructor', () => {
    it('creates an entry with the given id', () => {
      expect(entry.id).toBe(1);
    });

    it('creates an entry with the given value', () => {
      expect(entry.value).toBe(1024);
    });

    it('creates an entry with the given percentage', () => {
      expect(entry.percentage).toBe(12.5);
    });

    it('creates an entry with a timestamp', () => {
      expect(entry.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('#id', () => {
    it('returns the entry id', () => {
      const anotherEntry = new MemoryData(42, 2048, 25.0);
      expect(anotherEntry.id).toBe(42);
    });
  });

  describe('#value', () => {
    it('returns the entry value', () => {
      const anotherEntry = new MemoryData(1, 4096, 50.0);
      expect(anotherEntry.value).toBe(4096);
    });
  });

  describe('#percentage', () => {
    it('returns the entry percentage', () => {
      const anotherEntry = new MemoryData(1, 1024, 75.0);
      expect(anotherEntry.percentage).toBe(75.0);
    });
  });

  describe('#timestamp', () => {
    it('returns a Date created at construction time', () => {
      const before = new Date();
      const anotherEntry = new MemoryData(1, 1024, 10.0);
      const after = new Date();

      expect(anotherEntry.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(anotherEntry.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('#toJSON', () => {
    it('returns an object with the entry id', () => {
      expect(entry.toJSON().id).toBe(1);
    });

    it('returns an object with the entry value', () => {
      expect(entry.toJSON().value).toBe(1024);
    });

    it('returns an object with the entry percentage', () => {
      expect(entry.toJSON().percentage).toBe(12.5);
    });

    it('returns an object with the timestamp as ISO string', () => {
      expect(entry.toJSON().timestamp).toBe(entry.timestamp.toISOString());
    });
  });
});
