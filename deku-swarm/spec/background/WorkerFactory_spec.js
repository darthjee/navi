import { Job } from '../../lib/background/Job.js';
import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { Worker } from '../../lib/background/Worker.js';
import { WorkerFactory } from '../../lib/background/WorkerFactory.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';

class NoopJob extends Job {
  async perform() {}
}

describe('WorkerFactory', () => {
  describe('#build', () => {
    let factory;

    beforeEach(() => {
      JobRegistry.build({ cooldown: -1 });
      WorkersRegistry.build({ quantity: 0 });
      factory = new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
    });

    afterEach(() => {
      JobRegistry.reset();
      WorkersRegistry.reset();
    });

    it('builds an instance of Worker', () => {
      const worker = factory.build();
      expect(worker).toBeInstanceOf(Worker);
    });

    describe('onWorkerIdle', () => {
      let loggerFactory;

      beforeEach(() => {
        const logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
        loggerFactory = () => logContext;
      });

      const performWith = async (options) => {
        const worker = new WorkerFactory({
          jobRegistry: JobRegistry,
          workersRegistry: WorkersRegistry,
          loggerFactory,
          ...options
        }).build();
        worker.assign(new NoopJob({ id: 'job-1' }));
        await worker.perform();
      };

      it('is forwarded to built workers', async () => {
        const onWorkerIdle = jasmine.createSpy('onWorkerIdle');
        await performWith({ onWorkerIdle });
        expect(onWorkerIdle).toHaveBeenCalledOnceWith();
      });

      it('builds working workers when omitted', async () => {
        await expectAsync(performWith({})).toBeResolved();
      });
    });
  });
});