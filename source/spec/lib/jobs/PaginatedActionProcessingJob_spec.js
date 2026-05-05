import { Job } from '../../../lib/background/Job.js';
import { PaginatedActionProcessingJob } from '../../../lib/jobs/PaginatedActionProcessingJob.js';

describe('PaginatedActionProcessingJob', () => {
  let paginatedAction;
  let parameters;
  let job;
  let logContext;

  beforeEach(() => {
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    paginatedAction = jasmine.createSpyObj('paginatedAction', ['execute']);
    parameters = { parsedBody: { id: 1 }, headers: {}, parameters: {} };
    job = new PaginatedActionProcessingJob({ id: 'test-id', paginatedAction, parameters });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('test-id');
    });

    it('is an instance of Job', () => {
      expect(job).toBeInstanceOf(Job);
    });
  });

  describe('#maxRetries', () => {
    it('returns 1', () => {
      expect(job.maxRetries).toBe(1);
    });
  });

  describe('#arguments', () => {
    it('returns the parameters', () => {
      expect(job.arguments).toEqual({ parameters });
    });
  });

  describe('#perform', () => {
    describe('when the paginated action succeeds', () => {
      it('calls paginatedAction.execute with the parameters', async () => {
        await job.perform(logContext);
        expect(paginatedAction.execute).toHaveBeenCalledOnceWith(parameters);
      });

      it('clears lastError before performing', async () => {
        job.lastError = new Error('previous error');
        await job.perform(logContext);
        expect(job.lastError).toBeUndefined();
      });

      it('does not exhaust after a successful attempt', async () => {
        await job.perform(logContext);
        expect(job.exhausted()).toBeFalse();
      });
    });

    describe('when the paginated action throws', () => {
      const error = new Error('paginated action error');

      beforeEach(() => {
        paginatedAction.execute.and.throwError(error);
      });

      it('sets lastError to the thrown error', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.lastError).toEqual(error);
      });

      it('rethrows the error', async () => {
        await expectAsync(job.perform(logContext)).toBeRejectedWith(error);
      });

      it('is exhausted after one failure', async () => {
        await job.perform(logContext).catch(() => {});
        expect(job.exhausted()).toBeTrue();
      });
    });
  });

  describe('#exhausted', () => {
    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('returns true after one failed attempt', async () => {
      paginatedAction.execute.and.throwError(new Error('fail'));
      await job.perform(logContext).catch(() => {});
      expect(job.exhausted()).toBeTrue();
    });
  });
});
