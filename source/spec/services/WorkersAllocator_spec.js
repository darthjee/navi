import { Job } from '../../lib/models/Job.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { WorkersAllocator } from '../../lib/services/WorkersAllocator.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';

describe('WorkersAllocator', () => {
  let jobRegistry;
  let workersRegistry;
  let allocator;
  let job;
  let worker;
  let workers;
  let clients;

  beforeEach(() => {
    clients = new ClientRegistry({});
    jobRegistry = new JobRegistry({ clients });
    workers = new IdentifyableCollection();
    workersRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers });
    workersRegistry.initWorkers();
    worker = workers.byIndex(0);
    job = new Job({ payload: { value: 1 } });

    allocator = new WorkersAllocator({ jobRegistry, workersRegistry });
  });

  describe('when there when there is a single worker and no job', () => {
    it('does not allocate any workers', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeFalse();

      allocator.allocate();

      expect(worker.job).toBeUndefined();
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeFalse();
    });
  });

  describe('when there when there is a single worker and a single job', () => {
    beforeEach(() => {
      jobRegistry.push(job);
    });

    it('allocates all workers for the jobs', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(workersRegistry.hasIdleWorker()).toBeFalse();
      expect(jobRegistry.hasJob()).toBeFalse();
    });
  });

  describe('when there when there is a single worker and several jobs', () => {
    beforeEach(() => {
      jobRegistry.push(job);
      jobRegistry.push(new Job({ payload: { value: 2 } }));
      jobRegistry.push(new Job({ payload: { value: 3 } }));
    });

    it('allocates all workers for the jobs they can', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(workersRegistry.hasIdleWorker()).toBeFalse();
      expect(jobRegistry.hasJob()).toBeTrue();
    });
  });

  describe('when there when there are several workers', () => {
    beforeEach(() => {
      workers = new IdentifyableCollection();
      workersRegistry = new WorkersRegistry({ jobRegistry, quantity: 3, workers });
      workersRegistry.initWorkers();
      worker = workers.byIndex(0);
      allocator = new WorkersAllocator({ jobRegistry, workersRegistry });

      jobRegistry.push(job);
      jobRegistry.push(new Job({ payload: { value: 2 } }));
      jobRegistry.push(new Job({ payload: { value: 3 } }));
    });

    it('allocates all workers for the jobs they can', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(workersRegistry.hasIdleWorker()).toBeFalse();
      expect(jobRegistry.hasJob()).toBeFalse();
    });
  });
});