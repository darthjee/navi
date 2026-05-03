import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { JobLogsRequestHandler } from '../../../lib/server/JobLogsRequestHandler.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('JobLogsRequestHandler', () => {
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

  describe('#handle', () => {
    describe('when there are no logs for the given job', () => {
      it('responds with an empty array', () => {
        const handler = new JobLogsRequestHandler();
        handler.handle({ params: { job_id: 'job-1' }, query: {} }, res);
        expect(res.json).toHaveBeenCalledWith([]);
      });
    });

    describe('when there are logs for the given job', () => {
      beforeEach(() => {
        LogRegistry.info('first', { jobId: 'job-1' });
        LogRegistry.warn('second', { jobId: 'job-1' });
        LogRegistry.info('third', { jobId: 'job-1' });
        LogRegistry.info('other job', { jobId: 'job-2' });
      });

      it('responds with logs for that job only', () => {
        const handler = new JobLogsRequestHandler({ pageSize: 20 });
        handler.handle({ params: { job_id: 'job-1' }, query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(3);
        expect(result[0].message).toBe('first');
        expect(result[2].message).toBe('third');
      });

      it('does not include logs from other jobs', () => {
        const handler = new JobLogsRequestHandler();
        handler.handle({ params: { job_id: 'job-1' }, query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        result.forEach(log => expect(log.message).not.toBe('other job'));
      });

      it('respects the page size limit', () => {
        const handler = new JobLogsRequestHandler({ pageSize: 2 });
        handler.handle({ params: { job_id: 'job-1' }, query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        expect(result.length).toBe(2);
        expect(result[0].message).toBe('first');
        expect(result[1].message).toBe('second');
      });

      it('serializes logs using LogSerializer', () => {
        const handler = new JobLogsRequestHandler();
        handler.handle({ params: { job_id: 'job-1' }, query: {} }, res);
        const result = res.json.calls.mostRecent().args[0];
        expect(typeof result[0].id).toBe('number');
        expect(typeof result[0].level).toBe('string');
        expect(typeof result[0].message).toBe('string');
        expect(typeof result[0].attributes).toBe('object');
        expect(typeof result[0].timestamp).toBe('string');
      });

      describe('when last_id is provided', () => {
        it('returns only logs newer than the given id', () => {
          const logs = LogRegistry.getLogsByJobId('job-1');
          const firstId = logs[0].id;
          const handler = new JobLogsRequestHandler({ pageSize: 20 });
          handler.handle({ params: { job_id: 'job-1' }, query: { last_id: String(firstId) } }, res);
          const result = res.json.calls.mostRecent().args[0];
          expect(result.length).toBe(2);
          expect(result[0].message).toBe('second');
          expect(result[1].message).toBe('third');
        });
      });
    });
  });
});
