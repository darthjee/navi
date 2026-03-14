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
      expect(workerRegistry.workers).toEqual({});
    });
  });

  describe('#buildWorker', () => {
    it('returns a worker', () => {
      const worker = workerRegistry.buildWorker();

      expect(worker).toBeDefined();
    });

    it('adds the worker to the list', () => {
      workerRegistry.buildWorker();

      expect(Object.keys(workerRegistry.workers).length).toEqual(1);
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
        const worker1 = workerRegistry.buildWorker();
        const worker2 = workerRegistry.buildWorker();

        expect(workerRegistry.workers[worker1.id]).toEqual(worker1);
        expect(workerRegistry.workers[worker2.id]).toEqual(worker2);
      });

      it('adds all workers to the list', () => {
        workerRegistry.buildWorker();
        workerRegistry.buildWorker();

        expect(Object.keys(workerRegistry.workers).length).toEqual(2);
      });
    });

  });

  describe('WorkerRegistry#setBusy', () => {
    it('moves a worker from idle to busy when the worker exists', () => {
      const registry = new WorkerRegistry({ jobRegistry: {}, workers: 1 });
      const worker = registry.buildWorker();
      const id = worker.id;

      expect(registry.idle[id]).toBe(worker);

      registry.setBusy(id);

      expect(registry.busy[id]).toBe(worker);
      expect(registry.idle[id]).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      const registry = new WorkerRegistry({ jobRegistry: {}, workers: 1 });

      registry.setBusy('non-existent-id');

      expect(Object.keys(registry.busy).length).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      const registry = new WorkerRegistry({ jobRegistry: {}, workers: 1 });
      const worker = registry.buildWorker();
      const id = worker.id;

      registry.setBusy(id);
      registry.setBusy(id);

      expect(registry.busy[id]).toBe(worker);
      expect(registry.idle[id]).toBeUndefined();
    });
  });
});
