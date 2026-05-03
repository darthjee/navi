import { Job } from '../../../lib/background/Job.js';
import { ActionProcessingJob } from '../../../lib/jobs/ActionProcessingJob.js';

describe('ActionProcessingJob', () => {
  let action;
  let item;
  let job;
  let logContext;

  beforeEach(() => {
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    action = jasmine.createSpyObj('action', ['execute']);
    item = { id: 1, name: 'Electronics' };
    job = new ActionProcessingJob({ id: 'test-id', action, item });
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
    it('returns the item', () => {
      expect(job.arguments).toEqual({ item });
    });
  });

  describe('#perform', () => {
    describe('when the action succeeds', () => {
      it('calls action.execute with the item', async () => {
        await job.perform(logContext);
        expect(action.execute).toHaveBeenCalledOnceWith(item);
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

    describe('when the action throws', () => {
      const error = new Error('action error');

      beforeEach(() => {
        action.execute.and.throwError(error);
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
      action.execute.and.throwError(new Error('fail'));
      await job.perform(logContext).catch(() => {});
      expect(job.exhausted()).toBeTrue();
    });
  });
});
