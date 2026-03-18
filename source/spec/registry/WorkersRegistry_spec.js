import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';

describe('WorkersRegistry', () => {
  let jobRegistry;
  let workerRegistry;
  let worker;
  let worker_id;

  beforeEach(() => {
    jobRegistry = new JobRegistry();
  });

  describe('#constructor', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 3 });
    });

    it('stores the job registry', () => {
      expect(workerRegistry.jobRegistry).toEqual(jobRegistry);
    });

    it('stores the workers quantity', () => {
      expect(workerRegistry.quantity).toEqual(3);
    });

    it('initializes an empty workers list', () => {
      expect(workerRegistry.workers).toEqual(new IdentifyableCollection());
    });
  });

  describe('#initWorkers', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 3 });
    });

    it('builds the specified number of workers', () => {
      workerRegistry.initWorkers();

      expect(workerRegistry.workers.size()).toEqual(3);
    });

    it('assigns the job registry to the worker', () => {
      workerRegistry.initWorkers();

      const worker = workerRegistry.workers.byIndex(0);

      expect(worker.jobRegistry).toEqual(jobRegistry);
    });

    it('creates the workers as idle', () => {
      workerRegistry.initWorkers();

      const workers = workerRegistry.workers;
      const idleWorkers = workerRegistry.idle;

      expect(idleWorkers).toEqual(workers);
    });

    it('does not creates the workers as busy', () => {
      workerRegistry.initWorkers();

      expect(workerRegistry.busy).toEqual(new IdentifyableCollection());
    });

    it('assigns a uuid id to the worker', () => {
      workerRegistry.initWorkers();

      const workers = workerRegistry.workers.list();
      const worker = workers[0];

      expect(worker.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('WorkersRegistry#setBusy', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1 });
      workerRegistry.initWorkers();
      worker = workerRegistry.workers.byIndex(0);
      worker_id = worker.id;
    });

    it('moves a worker from idle to busy when the worker exists', () => {
      expect(workerRegistry.idle.get(worker_id)).toBe(worker);

      workerRegistry.setBusy(worker_id);

      expect(workerRegistry.busy.get(worker_id)).toBe(worker);
      expect(workerRegistry.idle.get(worker_id)).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      workerRegistry.setBusy('non-existent-id');

      expect(workerRegistry.busy.size()).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      workerRegistry.setBusy(worker_id);
      workerRegistry.setBusy(worker_id);

      expect(workerRegistry.busy.get(worker_id)).toBe(worker);
      expect(workerRegistry.idle[worker_id]).toBeUndefined();
    });
  });

  describe('WorkersRegistry#setIdle', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1 });
      workerRegistry.initWorkers();
      worker = workerRegistry.workers.byIndex(0);
      worker_id = worker.id;
      workerRegistry.setBusy(worker_id);
    });

    it('moves a worker from busy to idle when the worker exists', () => {
      expect(workerRegistry.busy.get(worker_id)).toBe(worker);

      workerRegistry.setIdle(worker_id);

      expect(workerRegistry.idle.get(worker_id)).toBe(worker);
      expect(workerRegistry.busy.get(worker_id)).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      workerRegistry.setIdle('non-existent-id');

      expect(workerRegistry.idle.size()).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      workerRegistry.setIdle(worker_id);
      workerRegistry.setIdle(worker_id);

      expect(workerRegistry.idle.get(worker_id)).toBe(worker);
      expect(workerRegistry.busy.get(worker_id)).toBeUndefined();
    });
  });

  describe('#hasBusyWorker', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1 });
      workerRegistry.initWorkers();
      worker = workerRegistry.workers.byIndex(0);
      worker_id = worker.id;
    });

    it('returns true when there is a busy worker', () => {
      workerRegistry.setBusy(worker_id);

      expect(workerRegistry.hasBusyWorker()).toBe(true);
    });

    it('returns false when there are no busy workers', () => {
      expect(workerRegistry.hasBusyWorker()).toBe(false);
    });
  });
  describe('#hasIdleWorker', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1 });
      workerRegistry.initWorkers();
      worker_id = workerRegistry.workers.byIndex(0).id;
    });

    it('returns true when there is a idle worker', () => {
      expect(workerRegistry.hasIdleWorker()).toBe(true);
    });

    it('returns false when there are no idle workers', () => {
      workerRegistry.setBusy(worker_id);
      expect(workerRegistry.hasIdleWorker()).toBe(false);
    });
  });

  describe('#getIdleWorker', () => {
    beforeEach(() => {
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1 });
      workerRegistry.initWorkers();
      worker_id = workerRegistry.workers.byIndex(0).id;
    });

    it('returns an idle worker when available', () => {
      const worker = workerRegistry.getIdleWorker();

      expect(worker).toBeDefined();
      expect(worker.id).toBe(worker_id);
    });

    it('returns null when no idle workers are available', () => {
      workerRegistry.setBusy(worker_id);
      const worker = workerRegistry.getIdleWorker();

      expect(worker).toBeNull();
    });
  });
});
