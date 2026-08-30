import { ExtractionSerializer } from '../../../lib/serializers/ExtractionSerializer.js';

describe('ExtractionSerializer', () => {
  const timestamp = new Date('2026-04-29T12:00:00.000Z');
  const makeRecord = (overrides = {}) => ({
    id: 1,
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 20,
    timestamp,
    ...overrides,
  });

  describe('.serialize', () => {
    describe('when given a single record', () => {
      it('returns a plain object with all extraction fields', () => {
        expect(ExtractionSerializer.serialize(makeRecord())).toEqual({
          id: 1,
          parserType: 'json_path',
          originUrl: 'http://example.com/list?page=1',
          itemCount: 20,
          timestamp: '2026-04-29T12:00:00.000Z',
        });
      });

      it('serializes the timestamp as an ISO string', () => {
        expect(typeof ExtractionSerializer.serialize(makeRecord()).timestamp).toBe('string');
      });

      it('keeps a null originUrl', () => {
        const record = makeRecord({ originUrl: null });
        expect(ExtractionSerializer.serialize(record).originUrl).toBeNull();
      });
    });

    describe('when given an array of records', () => {
      it('returns an array of serialized objects', () => {
        const a = makeRecord({ id: 1, originUrl: 'a' });
        const b = makeRecord({ id: 2, parserType: 'regex', originUrl: 'b' });
        const result = ExtractionSerializer.serialize([a, b]);
        expect(result.length).toBe(2);
        expect(result[0].originUrl).toBe('a');
        expect(result[1].parserType).toBe('regex');
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(ExtractionSerializer.serialize([])).toEqual([]);
      });
    });
  });
});
