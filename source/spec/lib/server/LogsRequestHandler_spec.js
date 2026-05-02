import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { LogsRequestHandler } from '../../../lib/server/LogsRequestHandler.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('LogsRequestHandler', () => {
  let res;

  beforeEach(() => {
    LogRegistry.build({ retention: 100 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    LogRegistry.reset();
    Logger.reset();
  });

  describe('#handle', () => {
    describe('when there are no logs', () => {
      it('responds with an empty array', () => {
        const handler = new LogsRequestHandler();
        handler.handle({ query: {} }, res);
        expect(res.json).toHaveBeenCalledWith([]);
      });
    });

    describe('when there are logs', () => {
      beforeEach(() => {
        LogRegistry.info('first');
        LogRegistry.warn('second');
        LogRegistry.info('third');
      });

      it('responds with all logs serialized', () => {
        const handler = new LogsRequestHandler({ pageSize: 20 });
        handler.handle({ query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(3);
        expect(result[0].message).toBe('first');
        expect(result[2].message).toBe('third');
      });

      it('respects the page size limit', () => {
        const handler = new LogsRequestHandler({ pageSize: 2 });
        handler.handle({ query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(2);
        expect(result[0].message).toBe('first');
        expect(result[1].message).toBe('second');
      });

      it('serializes logs using LogSerializer', () => {
        const handler = new LogsRequestHandler();
        handler.handle({ query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        expect(typeof result[0].id).toBe('number');
        expect(typeof result[0].level).toBe('string');
        expect(typeof result[0].message).toBe('string');
        expect(typeof result[0].attributes).toBe('object');
        expect(typeof result[0].timestamp).toBe('string');
      });

      describe('when last_id is provided', () => {
        it('passes last_id to LogRegistry and paginates the result', () => {
          const logs = LogRegistry.getLogs();
          const firstId = logs[0].id;
          const handler = new LogsRequestHandler({ pageSize: 1 });
          handler.handle({ query: { last_id: String(firstId) } }, res);
          const result = res.json.calls.mostRecent().args[0];
          expect(result.length).toBe(1);
          expect(result[0].message).toBe('second');
        });
      });
    });
  });
});
