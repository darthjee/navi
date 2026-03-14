import { JobRegistry } from '../../lib/models/JobRegistry.js';
import { WorkerRegistry } from '../../lib/models/WorkerRegistry.js';

describe('WorkerRegistry', () => {
  let jobRegistry;
  let workerRegistry;
  let worker;
  let worker_id;

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
    beforeEach(() => {
      worker = workerRegistry.buildWorker();
      worker_id = worker.id;
    });

    it('moves a worker from idle to busy when the worker exists', () => {
      expect(workerRegistry.idle[worker_id]).toBe(worker);

      workerRegistry.setBusy(worker_id);

      expect(workerRegistry.busy[worker_id]).toBe(worker);
      expect(workerRegistry.idle[worker_id]).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      workerRegistry.setBusy('non-existent-id');

      expect(Object.keys(workerRegistry.busy).length).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      workerRegistry.setBusy(worker_id);
      workerRegistry.setBusy(worker_id);

      expect(workerRegistry.busy[worker_id]).toBe(worker);
      expect(workerRegistry.idle[worker_id]).toBeUndefined();
    });
  });

  describe('WorkerRegistry#setIdle', () => {
    beforeEach(() => {
      worker = workerRegistry.buildWorker();
      worker_id = worker.id;
      workerRegistry.setBusy(worker_id);
    });

    it('moves a worker from busy to idle when the worker exists', () => {
      expect(workerRegistry.busy[worker_id]).toBe(worker);

      workerRegistry.setIdle(worker_id);

      expect(workerRegistry.idle[worker_id]).toBe(worker);
      expect(workerRegistry.busy[worker_id]).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      workerRegistry.setIdle('non-existent-id');

      expect(Object.keys(workerRegistry.idle).length).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      workerRegistry.setIdle(worker_id);
      workerRegistry.setIdle(worker_id);

      expect(workerRegistry.idle[worker_id]).toBe(worker);
      expect(workerRegistry.busy[worker_id]).toBeUndefined();
    });
  });
});
