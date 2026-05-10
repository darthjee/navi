import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { LogRegistry } from '../../../../../lib/registry/LogRegistry.js';
import { JobLogsHandlerExecutor } from '../../../../../lib/server/handlers/jobs/JobLogsHandlerExecutor.js';
import { EngineEvents } from '../../../../../lib/services/EngineEvents.js';
import { Logger } from '../../../../../lib/utils/logging/Logger.js';

describe('JobLogsHandlerExecutor', () => {
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
    expect(new JobLogsHandlerExecutor({ params: {}, query: {} }, res, 20))
      .toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when there are no logs for the given job', () => {
      it('responds with an empty array', () => {
        new JobLogsHandlerExecutor({ params: { job_id: 'job-1' }, query: {} }, res, 20).handle();
        expect(res.json).toHaveBeenCalledWith([]);
      });
    });

    describe('when there are logs for the given job', () => {
      beforeEach(() => {
        LogRegistry.info('first', { jobId: 'job-1' });
        LogRegistry.warn('second', { jobId: 'job-1' });
        LogRegistry.info('third', { jobId: 'job-1' });
        LogRegistry.info('other', { jobId: 'job-2' });
      });

      it('responds with logs for that job only', () => {
        new JobLogsHandlerExecutor({ params: { job_id: 'job-1' }, query: {} }, res, 20).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(3);
        expect(result[0].message).toBe('first');
        expect(result[2].message).toBe('third');
      });

      it('respects the page size limit', () => {
        new JobLogsHandlerExecutor({ params: { job_id: 'job-1' }, query: {} }, res, 2).handle();
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(2);
        expect(result[0].message).toBe('first');
      });

      describe('when last_id is provided', () => {
        it('returns only logs newer than the given id', () => {
          const logs = LogRegistry.getLogsByJobId('job-1');
          const firstId = logs[0].id;
          new JobLogsHandlerExecutor(
            { params: { job_id: 'job-1' }, query: { last_id: String(firstId) } }, res, 20
          ).handle();
          const result = res.json.calls.mostRecent().args[0];
          expect(result.length).toBe(2);
          expect(result[0].message).toBe('second');
        });
      });
    });
  });
});
