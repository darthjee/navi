import { Job } from '../../lib/background/Job.js';
import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { Worker } from '../../lib/background/Worker.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { IdentifyableCollection } from '../../lib/collections/IdentifyableCollection.js';
import { Queue } from '../../lib/collections/Queue.js';

class TestJob extends Job {
  constructor({ id, error } = {}) {
    super({ id });
    this.error = error;
  }

  async perform(logContext) {
    this.performedWith = logContext;

    if (this.error) {
      throw this.error;
    }
  }
}

describe('Worker', () => {
  let worker;
  let finished;
  let failed;
  let idle;
  let job;
  let logContext;
  let loggerFactory;

  beforeEach(() => {
    finished = new IdentifyableCollection();
    failed = new Queue();
    JobRegistry.build({ failed, finished });

    idle = new IdentifyableCollection();
    WorkersRegistry.build({ quantity: 0, idle });

    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    loggerFactory = jasmine.createSpy('loggerFactory').and.returnValue(logContext);

    worker = new Worker({ id: 1, jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory });
  });

  afterEach(() => {
    JobRegistry.reset();
    WorkersRegistry.reset();
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(worker.id).toEqual(1);
    });
  });

  describe('onWorkerIdle', () => {
    let onWorkerIdle;
    let setIdleSpy;

    beforeEach(() => {
      setIdleSpy = spyOn(WorkersRegistry, 'setIdle').and.callThrough();
      onWorkerIdle = jasmine.createSpy('onWorkerIdle').and.callFake(() => {
        expect(setIdleSpy).toHaveBeenCalledWith(1);
      });
      worker = new Worker({ id: 1, jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory, onWorkerIdle });
    });

    it('is called once, after setIdle, with no arguments when the job succeeds', async () => {
      worker.assign(new TestJob({ id: 'job-1' }));
      await worker.perform();
      expect(onWorkerIdle).toHaveBeenCalledOnceWith();
    });

    it('is called once, after setIdle, with no arguments when the job fails', async () => {
      worker.assign(new TestJob({ id: 'job-1', error: new Error('boom') }));
      await worker.perform();
      expect(onWorkerIdle).toHaveBeenCalledOnceWith();
    });

    it('does not throw when no hook is given', async () => {
      worker = new Worker({ id: 1, jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory });
      worker.assign(new TestJob({ id: 'job-1' }));
      await expectAsync(worker.perform()).toBeResolved();
    });

    describe('when the hook throws', () => {
      beforeEach(() => {
        onWorkerIdle.and.throwError('hook boom');
        worker.assign(new TestJob({ id: 'job-1' }));
      });

      it('still resolves', async () => {
        await expectAsync(worker.perform()).toBeResolved();
      });

      it('has already set the worker idle', async () => {
        await worker.perform();
        expect(setIdleSpy).toHaveBeenCalledWith(1);
      });

      it('logs a warning once', async () => {
        await worker.perform();
        expect(logContext.warn).toHaveBeenCalledOnceWith(jasmine.stringContaining('hook boom'));
      });
    });
  });

  describe('#assign', () => {
    it('assigns a job to the worker', () => {
      job = new TestJob({ id: 'job-1' });
      worker.assign(job);
      expect(worker.job).toEqual(job);
    });
  });

  describe('#perform', () => {
    describe('when no job is assigned', () => {
      it('throws an error', async () => {
        const expectedError = new Error('No job assigned to worker');
        await expectAsync(worker.perform()).toBeRejectedWith(expectedError);
      });
    });

    describe('when the job succeeds', () => {
      beforeEach(() => {
        job = new TestJob({ id: 'job-1' });
        worker.assign(job);
      });

      it('builds a logger via loggerFactory with the worker and job ids', async () => {
        await worker.perform();
        expect(loggerFactory).toHaveBeenCalledWith({ workerId: 1, jobId: 'job-1' });
      });

      it('performs the job with the built log context', async () => {
        await worker.perform();
        expect(job.performedWith).toBe(logContext);
      });

      it('finishes the job', async () => {
        expect(finished.has(job.id)).toBeFalse();
        await worker.perform();
        expect(finished.has(job.id)).toBeTrue();
      });

      it('unassigns the job after finishing', async () => {
        expect(worker.job).toEqual(job);
        await worker.perform();
        expect(worker.job).toBeUndefined();
      });

      it('does not log an error', async () => {
        await worker.perform();
        expect(logContext.error).not.toHaveBeenCalled();
      });
    });

    describe('when the job fails', () => {
      let error;

      beforeEach(() => {
        error = new Error('boom');
        job = new TestJob({ id: 'job-1', error });
        worker.assign(job);
      });

      it('logs the error via the log context', async () => {
        await worker.perform();
        expect(logContext.error).toHaveBeenCalledWith(jasmine.stringContaining(job.id));
      });

      it('fails the job', async () => {
        expect(failed.hasAny()).toBeFalse();
        await worker.perform();
        expect(failed.hasAny()).toBeTrue();
        expect(failed.pick()).toEqual(job);
      });

      it('unassigns the job after finishing', async () => {
        expect(worker.job).toEqual(job);
        await worker.perform();
        expect(worker.job).toBeUndefined();
      });
    });
  });
});
