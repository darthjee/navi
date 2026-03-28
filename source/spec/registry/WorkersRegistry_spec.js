import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';
import { JobRegistryFactory } from '../support/factories/JobRegistryFactory.js';

describe('WorkersRegistry', () => {
  let jobRegistry;
  let workerRegistry;
  let worker;
  let worker_id;

  beforeEach(() => {
    jobRegistry = JobRegistryFactory.build();
  });

  describe('#constructor', () => {
    let workers;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 3, workers });
    });

    it('initializes an empty workers list', () => {
      expect(workers).toEqual(new IdentifyableCollection());
    });

    it('uses the job registry for created workers', () => {
      workerRegistry.initWorkers();

      expect(workers.byIndex(0).jobRegistry).toEqual(jobRegistry);
    });

    it('initializes with the specified quantity', () => {
      workerRegistry.initWorkers();

      expect(workers.size()).toEqual(3);
    });
  });

  describe('#initWorkers', () => {
    let workers;
    let busy;
    let idle;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      busy = new IdentifyableCollection();
      idle = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 3, workers, busy, idle });
    });

    it('builds the specified number of workers', () => {
      workerRegistry.initWorkers();

      expect(workers.size()).toEqual(3);
    });

    it('assigns the job registry to the worker', () => {
      workerRegistry.initWorkers();

      const createdWorker = workers.byIndex(0);

      expect(createdWorker.jobRegistry).toEqual(jobRegistry);
    });

    it('creates the workers as idle', () => {
      workerRegistry.initWorkers();

      expect(idle).toEqual(workers);
    });

    it('does not creates the workers as busy', () => {
      workerRegistry.initWorkers();

      expect(busy).toEqual(new IdentifyableCollection());
    });

    it('assigns a uuid id to the worker', () => {
      workerRegistry.initWorkers();

      const createdWorkers = workers.list();
      const createdWorker = createdWorkers[0];

      expect(createdWorker.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('WorkersRegistry#setBusy', () => {
    let workers;
    let busy;
    let idle;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      busy = new IdentifyableCollection();
      idle = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers, busy, idle });
      workerRegistry.initWorkers();
      worker = workers.byIndex(0);
      worker_id = worker.id;
    });

    it('moves a worker from idle to busy when the worker exists', () => {
      expect(idle.get(worker_id)).toBe(worker);

      workerRegistry.setBusy(worker_id);

      expect(busy.get(worker_id)).toBe(worker);
      expect(idle.get(worker_id)).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      workerRegistry.setBusy('non-existent-id');

      expect(busy.size()).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      workerRegistry.setBusy(worker_id);
      workerRegistry.setBusy(worker_id);

      expect(busy.get(worker_id)).toBe(worker);
      expect(idle[worker_id]).toBeUndefined();
    });
  });

  describe('WorkersRegistry#setIdle', () => {
    let workers;
    let busy;
    let idle;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      busy = new IdentifyableCollection();
      idle = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers, busy, idle });
      workerRegistry.initWorkers();
      worker = workers.byIndex(0);
      worker_id = worker.id;
      workerRegistry.setBusy(worker_id);
    });

    it('moves a worker from busy to idle when the worker exists', () => {
      expect(busy.get(worker_id)).toBe(worker);

      workerRegistry.setIdle(worker_id);

      expect(idle.get(worker_id)).toBe(worker);
      expect(busy.get(worker_id)).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      workerRegistry.setIdle('non-existent-id');

      expect(idle.size()).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      workerRegistry.setIdle(worker_id);
      workerRegistry.setIdle(worker_id);

      expect(idle.get(worker_id)).toBe(worker);
      expect(busy.get(worker_id)).toBeUndefined();
    });
  });

  describe('#hasBusyWorker', () => {
    let workers;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers });
      workerRegistry.initWorkers();
      worker = workers.byIndex(0);
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
    let workers;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers });
      workerRegistry.initWorkers();
      worker_id = workers.byIndex(0).id;
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
    let workers;

    beforeEach(() => {
      workers = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers });
      workerRegistry.initWorkers();
      worker_id = workers.byIndex(0).id;
    });

    it('returns an idle worker when available', () => {
      const idleWorker = workerRegistry.getIdleWorker();

      expect(idleWorker).toBeDefined();
      expect(idleWorker.id).toBe(worker_id);
    });

    it('returns null when no idle workers are available', () => {
      workerRegistry.setBusy(worker_id);
      const idleWorker = workerRegistry.getIdleWorker();

      expect(idleWorker).toBeNull();
    });
  });
});
