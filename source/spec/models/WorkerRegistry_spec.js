import { JobRegistry } from '../../lib/models/JobRegistry.js';
import { WorkerRegistry } from '../../lib/models/WorkerRegistry.js';

describe('WorkerRegistry', () => {
  let jobRegistry;
  let workerRegistry;

  beforeEach(() => {
    jobRegistry = new JobRegistry();
    workerRegistry = new WorkerRegistry({ jobRegistry, workers: 3 });
  });

  describe('#constructor', () => {
    it('stores the job registry', () => {
      expect(workerRegistry.jobRegistry).toEqual(jobRegistry);
    });

    it('stores the workers count', () => {
      expect(workerRegistry.workersCount).toEqual(3);
    });

    it('initializes an empty workers list', () => {
      expect(workerRegistry.workers).toEqual([]);
    });
  });

  describe('#buildWorker', () => {
    it('returns a worker', () => {
      const worker = workerRegistry.buildWorker();

      expect(worker).toBeDefined();
    });

    it('adds the worker to the list', () => {
      workerRegistry.buildWorker();

      expect(workerRegistry.workers.length).toEqual(1);
    });

    it('assigns the job registry to the worker', () => {
      const worker = workerRegistry.buildWorker();

      expect(worker.jobRegistry).toEqual(jobRegistry);
    });

    it('assigns a uuid id to the worker', () => {
      const worker = workerRegistry.buildWorker();

      expect(worker.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    describe('when called multiple times', () => {
      it('assigns unique ids to each worker', () => {
        workerRegistry.buildWorker();
        workerRegistry.buildWorker();

        const ids = workerRegistry.workers.map(worker => worker.id);

        expect(ids[0]).not.toEqual(ids[1]);
      });

      it('adds all workers to the list', () => {
        workerRegistry.buildWorker();
        workerRegistry.buildWorker();

        expect(workerRegistry.workers.length).toEqual(2);
      });
    });

  });
});
