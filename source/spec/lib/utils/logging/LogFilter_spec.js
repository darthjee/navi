import { LogFilter } from '../../../../lib/utils/logging/LogFilter.js';

describe('LogFilter', () => {
  const makeLogs = (...ids) => ids.map(id => ({ id, message: `msg-${id}` }));

  describe('#filter', () => {
    describe('when no options are given', () => {
      it('returns all logs unchanged', () => {
        const logs = makeLogs(1, 2, 3);
        expect(new LogFilter(logs).filter()).toEqual(logs);
      });
    });

    describe('when lastId is undefined', () => {
      it('returns all logs unchanged', () => {
        const logs = makeLogs(1, 2, 3);
        expect(new LogFilter(logs).filter({ lastId: undefined })).toEqual(logs);
      });
    });

    describe('when lastId matches a log in the middle', () => {
      it('returns only logs newer than lastId', () => {
        const logs = makeLogs(1, 2, 3, 4, 5);
        const result = new LogFilter(logs).filter({ lastId: 3 });
        expect(result.map(l => l.id)).toEqual([4, 5]);
      });
    });

    describe('when lastId is provided as a string', () => {
      it('parses it as an integer and filters correctly', () => {
        const logs = makeLogs(1, 2, 3);
        const result = new LogFilter(logs).filter({ lastId: '2' });
        expect(result.map(l => l.id)).toEqual([3]);
      });
    });

    describe('when lastId matches the most recent log', () => {
      it('returns an empty array', () => {
        const logs = makeLogs(1, 2, 3);
        expect(new LogFilter(logs).filter({ lastId: 3 })).toEqual([]);
      });
    });

    describe('when lastId is not found', () => {
      it('returns an empty array', () => {
        const logs = makeLogs(1, 2, 3);
        expect(new LogFilter(logs).filter({ lastId: 99 })).toEqual([]);
      });
    });
  });
});
