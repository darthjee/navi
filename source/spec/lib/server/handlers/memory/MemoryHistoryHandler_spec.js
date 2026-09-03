import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { MemoryRegistry } from '../../../../../lib/registry/MemoryRegistry.js';
import { MemoryHistoryHandler } from '../../../../../lib/server/handlers/memory/MemoryHistoryHandler.js';

describe('MemoryHistoryHandler', () => {
  let res;

  beforeEach(() => {
    MemoryRegistry.build({ retention: 100 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    MemoryRegistry.reset();
  });

  it('is an instance of RequestHandler', () => {
    expect(new MemoryHistoryHandler({ query: {} }, res, 20)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when there are no entries', () => {
      it('responds with an empty array', () => {
        new MemoryHistoryHandler({ query: {} }, res, 20).handle();
        expect(res.json).toHaveBeenCalledWith([]);
      });
    });

    describe('when there are entries', () => {
      beforeEach(() => {
        MemoryRegistry.add(100, 10);
        MemoryRegistry.add(200, 20);
        MemoryRegistry.add(300, 30);
      });

      it('responds with all entries serialized, oldest-first', () => {
        new MemoryHistoryHandler({ query: {} }, res, 20).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(3);
        expect(result[0]).toEqual(jasmine.objectContaining({ value: 100, percentage: 10 }));
        expect(result[2]).toEqual(jasmine.objectContaining({ value: 300, percentage: 30 }));
      });

      it('serializes the timestamp as an ISO string', () => {
        new MemoryHistoryHandler({ query: {} }, res, 20).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(typeof result[0].timestamp).toBe('string');
      });

      it('respects the page size limit', () => {
        new MemoryHistoryHandler({ query: {} }, res, 2).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(2);
        expect(result[0].value).toBe(100);
      });

      describe('when last_id is provided', () => {
        it('paginates from the given id', () => {
          const entries = MemoryRegistry.getEntries();
          const firstId = entries[0].id;
          new MemoryHistoryHandler({ query: { last_id: String(firstId) } }, res, 1).handle();
          const result = res.json.calls.mostRecent().args[0];
          expect(result.length).toBe(1);
          expect(result[0].value).toBe(200);
        });
      });

      describe('when last_id is unknown or aged out', () => {
        it('responds with an empty array', () => {
          new MemoryHistoryHandler({ query: { last_id: '999999' } }, res, 20).handle();
          expect(res.json).toHaveBeenCalledWith([]);
        });
      });
    });
  });
});
