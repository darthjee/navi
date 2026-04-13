import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';

describe('WorkersRegistry', () => {
  let worker;
  let workerId;
  let workers;
  let busy;
  let idle;

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    workers = new IdentifyableCollection();
    busy = new IdentifyableCollection();
    idle = new IdentifyableCollection();
    WorkersRegistry.build({ quantity: 1, workers, busy, idle });
    WorkersRegistry.initWorkers();
    worker = workers.byIndex(0);
    workerId = worker.id;
  });

  afterEach(() => {
    JobRegistry.reset();
    WorkersRegistry.reset();
  });

  describe('.build', () => {
    beforeEach(() => {
      WorkersRegistry.reset();
      workers = new IdentifyableCollection();
      WorkersRegistry.build({ quantity: 3, workers });
    });

    it('initializes an empty workers list', () => {
      expect(workers).toEqual(new IdentifyableCollection());
    });

    it('initializes with the specified quantity', () => {
      WorkersRegistry.initWorkers();

      expect(workers.size()).toEqual(3);
    });

    it('throws when called twice without reset', () => {
      expect(() => WorkersRegistry.build({ quantity: 1 }))
        .toThrowError('WorkersRegistry.build() has already been called. Call reset() first.');
    });
  });

  describe('.initWorkers', () => {
    beforeEach(() => {
      WorkersRegistry.reset();
      workers = new IdentifyableCollection();
      busy = new IdentifyableCollection();
      idle = new IdentifyableCollection();
      WorkersRegistry.build({ quantity: 3, workers, busy, idle });
    });

    it('builds the specified number of workers', () => {
      WorkersRegistry.initWorkers();

      expect(workers.size()).toEqual(3);
    });

    it('creates the workers as idle', () => {
      WorkersRegistry.initWorkers();

      expect(idle).toEqual(workers);
    });

    it('does not creates the workers as busy', () => {
      WorkersRegistry.initWorkers();

      expect(busy).toEqual(new IdentifyableCollection());
    });

    it('assigns a uuid id to the worker', () => {
      WorkersRegistry.initWorkers();

      const createdWorkers = workers.list();
      const createdWorker = createdWorkers[0];

      expect(createdWorker.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('.setBusy', () => {
    it('moves a worker from idle to busy when the worker exists', () => {
      expect(idle.get(workerId)).toBe(worker);

      WorkersRegistry.setBusy(workerId);

      expect(busy.get(workerId)).toBe(worker);
      expect(idle.get(workerId)).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      WorkersRegistry.setBusy('non-existent-id');

      expect(busy.size()).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      WorkersRegistry.setBusy(workerId);
      WorkersRegistry.setBusy(workerId);

      expect(busy.get(workerId)).toBe(worker);
      expect(idle[workerId]).toBeUndefined();
    });
  });

  describe('.setIdle', () => {
    beforeEach(() => {
      WorkersRegistry.setBusy(workerId);
    });

    it('moves a worker from busy to idle when the worker exists', () => {
      expect(busy.get(workerId)).toBe(worker);

      WorkersRegistry.setIdle(workerId);

      expect(idle.get(workerId)).toBe(worker);
      expect(busy.get(workerId)).toBeUndefined();
    });

    it('does nothing when the worker id does not exist', () => {
      WorkersRegistry.setIdle('non-existent-id');

      expect(idle.size()).toBe(0);
    });

    it('is idempotent when called multiple times for the same worker', () => {
      WorkersRegistry.setIdle(workerId);
      WorkersRegistry.setIdle(workerId);

      expect(idle.get(workerId)).toBe(worker);
      expect(busy.get(workerId)).toBeUndefined();
    });
  });

  describe('.hasBusyWorker', () => {
    it('returns true when there is a busy worker', () => {
      WorkersRegistry.setBusy(workerId);

      expect(WorkersRegistry.hasBusyWorker()).toBe(true);
    });

    it('returns false when there are no busy workers', () => {
      expect(WorkersRegistry.hasBusyWorker()).toBe(false);
    });
  });

  describe('.hasIdleWorker', () => {
    it('returns true when there is a idle worker', () => {
      expect(WorkersRegistry.hasIdleWorker()).toBe(true);
    });

    it('returns false when there are no idle workers', () => {
      WorkersRegistry.setBusy(workerId);
      expect(WorkersRegistry.hasIdleWorker()).toBe(false);
    });
  });

  describe('.getIdleWorker', () => {
    it('returns an idle worker when available', () => {
      const idleWorker = WorkersRegistry.getIdleWorker();

      expect(idleWorker).toBeDefined();
      expect(idleWorker.id).toBe(workerId);
    });

    it('returns null when no idle workers are available', () => {
      WorkersRegistry.setBusy(workerId);
      const idleWorker = WorkersRegistry.getIdleWorker();

      expect(idleWorker).toBeNull();
    });
  });

  describe('.stats', () => {
    describe('when all workers are idle', () => {
      it('returns idle count matching number of workers and busy count of zero', () => {
        expect(WorkersRegistry.stats()).toEqual({ idle: 1, busy: 0 });
      });
    });

    describe('when a worker is set to busy', () => {
      beforeEach(() => {
        WorkersRegistry.setBusy(workerId);
      });

      it('returns busy count of 1 and idle count of zero', () => {
        expect(WorkersRegistry.stats()).toEqual({ idle: 0, busy: 1 });
      });
    });

    describe('when a busy worker is returned to idle', () => {
      beforeEach(() => {
        WorkersRegistry.setBusy(workerId);
        WorkersRegistry.setIdle(workerId);
      });

      it('returns idle count of 1 and busy count of zero', () => {
        expect(WorkersRegistry.stats()).toEqual({ idle: 1, busy: 0 });
      });
    });
  });
});
