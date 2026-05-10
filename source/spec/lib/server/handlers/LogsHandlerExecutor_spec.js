import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { LogsHandlerExecutor } from '../../../../lib/server/handlers/LogsHandlerExecutor.js';
import { EngineEvents } from '../../../../lib/services/EngineEvents.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';

describe('LogsHandlerExecutor', () => {
  let res;

  beforeEach(() => {
    Logger.suppress();
    LogRegistry.build({ retention: 100 });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    LogRegistry.reset();
    Logger.reset();
    EngineEvents.reset();
  });

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new LogsHandlerExecutor({ query: {} }, res, 20)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when there are no logs', () => {
      it('responds with an empty array', () => {
        new LogsHandlerExecutor({ query: {} }, res, 20).handle();
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
        new LogsHandlerExecutor({ query: {} }, res, 20).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(3);
        expect(result[0].message).toBe('first');
        expect(result[2].message).toBe('third');
      });

      it('respects the page size limit', () => {
        new LogsHandlerExecutor({ query: {} }, res, 2).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(2);
        expect(result[0].message).toBe('first');
      });

      describe('when last_id is provided', () => {
        it('paginates from the given id', () => {
          const logs = LogRegistry.getLogs();
          const firstId = logs[0].id;
          new LogsHandlerExecutor({ query: { last_id: String(firstId) } }, res, 1).handle();
          const result = res.json.calls.mostRecent().args[0];
          expect(result.length).toBe(1);
          expect(result[0].message).toBe('second');
        });
      });
    });

    describe('when jobId is provided', () => {
      beforeEach(() => {
        LogRegistry.info('job log', { jobId: 'job-1' });
        LogRegistry.info('other log');
      });

      it('returns only logs for that job', () => {
        new LogsHandlerExecutor({ query: { jobId: 'job-1' } }, res, 20).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(1);
        expect(result[0].message).toBe('job log');
      });
    });

    describe('when workerId is provided', () => {
      beforeEach(() => {
        LogRegistry.info('worker log', { workerId: 'worker-1' });
        LogRegistry.info('other log');
      });

      it('returns only logs for that worker', () => {
        new LogsHandlerExecutor({ query: { workerId: 'worker-1' } }, res, 20).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(1);
        expect(result[0].message).toBe('worker log');
      });
    });

    describe('when both jobId and workerId are provided', () => {
      it('responds with a 400 error', () => {
        res.status = jasmine.createSpy('status').and.returnValue(res);
        new LogsHandlerExecutor({ query: { jobId: 'job-1', workerId: 'worker-1' } }, res, 20).handle();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({ error: jasmine.any(String) }));
      });
    });
  });
});
