import { MemoryDataSerializer } from '../../../lib/serializers/MemoryDataSerializer.js';

describe('MemoryDataSerializer', () => {
  const timestamp = new Date('2026-04-29T12:00:00.000Z');
  const makeEntry = (overrides = {}) => ({
    id: 1,
    value: 123456,
    percentage: 42.5,
    timestamp,
    ...overrides,
  });

  describe('.serialize', () => {
    describe('when given a single entry', () => {
      it('returns a plain object with all entry fields', () => {
        const entry = makeEntry();
        expect(MemoryDataSerializer.serialize(entry)).toEqual({
          id: 1,
          value: 123456,
          percentage: 42.5,
          timestamp: '2026-04-29T12:00:00.000Z',
        });
      });

      it('serializes the timestamp as an ISO string', () => {
        const entry = makeEntry();
        expect(typeof MemoryDataSerializer.serialize(entry).timestamp).toBe('string');
      });
    });

    describe('when given an array of entries', () => {
      it('returns an array of serialized objects', () => {
        const entryA = makeEntry({ id: 1, value: 111 });
        const entryB = makeEntry({ id: 2, value: 222, percentage: 10 });
        const result = MemoryDataSerializer.serialize([entryA, entryB]);
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(111);
        expect(result[1].percentage).toBe(10);
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(MemoryDataSerializer.serialize([])).toEqual([]);
      });
    });
  });
});
