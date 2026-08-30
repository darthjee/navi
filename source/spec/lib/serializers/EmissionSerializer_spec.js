import { EmissionSerializer } from '../../../lib/serializers/EmissionSerializer.js';

describe('EmissionSerializer', () => {
  const timestamp = new Date('2026-04-29T12:00:00.000Z');
  const makeRecord = (overrides = {}) => ({
    id: 1,
    extractionId: 7,
    status: 'success',
    url: 'http://example.com/hook',
    method: 'POST',
    httpStatus: 200,
    error: null,
    itemRef: 'abc123',
    timestamp,
    ...overrides,
  });

  describe('.serialize', () => {
    describe('when given a single record', () => {
      it('returns a plain object with all emission fields', () => {
        expect(EmissionSerializer.serialize(makeRecord())).toEqual({
          id: 1,
          extractionId: 7,
          status: 'success',
          url: 'http://example.com/hook',
          method: 'POST',
          httpStatus: 200,
          error: null,
          itemRef: 'abc123',
          timestamp: '2026-04-29T12:00:00.000Z',
        });
      });

      it('defaults extractionId to null when the record has none', () => {
        const record = makeRecord({ extractionId: null });
        expect(EmissionSerializer.serialize(record).extractionId).toBeNull();
      });

      it('serializes the timestamp as an ISO string', () => {
        expect(typeof EmissionSerializer.serialize(makeRecord()).timestamp).toBe('string');
      });

      it('keeps a failure error message', () => {
        const record = makeRecord({ status: 'failed', error: 'boom', httpStatus: 502 });
        expect(EmissionSerializer.serialize(record).error).toBe('boom');
      });
    });

    describe('when given an array of records', () => {
      it('returns an array of serialized objects', () => {
        const a = makeRecord({ id: 1, itemRef: 'a' });
        const b = makeRecord({ id: 2, status: 'dead', itemRef: 'b' });
        const result = EmissionSerializer.serialize([a, b]);
        expect(result.length).toBe(2);
        expect(result[0].itemRef).toBe('a');
        expect(result[1].status).toBe('dead');
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(EmissionSerializer.serialize([])).toEqual([]);
      });
    });
  });
});
