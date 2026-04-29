import { LogSerializer } from '../../../lib/serializers/LogSerializer.js';

describe('LogSerializer', () => {
  const timestamp = new Date('2026-04-29T12:00:00.000Z');
  const makeLog = (overrides = {}) => ({
    id: 1,
    level: 'info',
    message: 'test message',
    attributes: {},
    timestamp,
    ...overrides,
  });

  describe('.serialize', () => {
    describe('when given a single log', () => {
      it('returns a plain object with all log fields', () => {
        const log = makeLog();
        expect(LogSerializer.serialize(log)).toEqual({
          id: 1,
          level: 'info',
          message: 'test message',
          attributes: {},
          timestamp: '2026-04-29T12:00:00.000Z',
        });
      });

      it('serializes the timestamp as an ISO string', () => {
        const log = makeLog();
        expect(typeof LogSerializer.serialize(log).timestamp).toBe('string');
      });

      it('includes custom attributes', () => {
        const log = makeLog({ attributes: { jobId: 42 } });
        expect(LogSerializer.serialize(log).attributes).toEqual({ jobId: 42 });
      });
    });

    describe('when given an array of logs', () => {
      it('returns an array of serialized objects', () => {
        const logA = makeLog({ id: 1, message: 'first' });
        const logB = makeLog({ id: 2, level: 'warn', message: 'second' });
        const result = LogSerializer.serialize([logA, logB]);
        expect(result.length).toBe(2);
        expect(result[0].message).toBe('first');
        expect(result[1].level).toBe('warn');
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(LogSerializer.serialize([])).toEqual([]);
      });
    });
  });
});
