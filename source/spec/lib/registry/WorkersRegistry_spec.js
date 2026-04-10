import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';

describe('WorkersRegistry', () => {
  let workerRegistry;
  let worker;
  let worker_id;
  let workers;
  let busy;
  let idle;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    workers = new IdentifyableCollection();
    busy = new IdentifyableCollection();
    idle = new IdentifyableCollection();
    workerRegistry = new WorkersRegistry({ quantity: 1, workers, busy, idle });
    workerRegistry.initWorkers();
    worker = workers.byIndex(0);
    worker_id = worker.id;
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  describe('#constructor', () => {
    beforeEach(() => {
      workers = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ quantity: 3, workers });
    });

    it('initializes an empty workers list', () => {
      expect(workers).toEqual(new IdentifyableCollection());
    });

    it('initializes with the specified quantity', () => {
      workerRegistry.initWorkers();

      expect(workers.size()).toEqual(3);
    });
  });

  describe('#initWorkers', () => {
    beforeEach(() => {
      workers = new IdentifyableCollection();
      busy = new IdentifyableCollection();
      idle = new IdentifyableCollection();
      workerRegistry = new WorkersRegistry({ quantity: 3, workers, busy, idle });
    });

    it('builds the specified number of workers', () => {
      workerRegistry.initWorkers();

      expect(workers.size()).toEqual(3);
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
    beforeEach(() => {
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
    it('returns true when there is a busy worker', () => {
      workerRegistry.setBusy(worker_id);

      expect(workerRegistry.hasBusyWorker()).toBe(true);
    });

    it('returns false when there are no busy workers', () => {
      expect(workerRegistry.hasBusyWorker()).toBe(false);
    });
  });

  describe('#hasIdleWorker', () => {
    it('returns true when there is a idle worker', () => {
      expect(workerRegistry.hasIdleWorker()).toBe(true);
    });

    it('returns false when there are no idle workers', () => {
      workerRegistry.setBusy(worker_id);
      expect(workerRegistry.hasIdleWorker()).toBe(false);
    });
  });

  describe('#getIdleWorker', () => {
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

  describe('#stats', () => {
    describe('when all workers are idle', () => {
      it('returns idle count matching number of workers and busy count of zero', () => {
        expect(workerRegistry.stats()).toEqual({ idle: 1, busy: 0 });
      });
    });

    describe('when a worker is set to busy', () => {
      beforeEach(() => {
        workerRegistry.setBusy(worker_id);
      });

      it('returns busy count of 1 and idle count of zero', () => {
        expect(workerRegistry.stats()).toEqual({ idle: 0, busy: 1 });
      });
    });

    describe('when a busy worker is returned to idle', () => {
      beforeEach(() => {
        workerRegistry.setBusy(worker_id);
        workerRegistry.setIdle(worker_id);
      });

      it('returns idle count of 1 and busy count of zero', () => {
        expect(workerRegistry.stats()).toEqual({ idle: 1, busy: 0 });
      });
    });
  });
});
