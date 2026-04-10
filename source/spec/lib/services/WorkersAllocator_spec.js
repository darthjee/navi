import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { WorkersAllocator } from '../../../lib/services/WorkersAllocator.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';

describe('WorkersAllocator', () => {
  let jobRegistry;
  let workersRegistry;
  let allocator;
  let job;
  let worker;
  let workers;

  let jobFactory;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    JobFactory.registry('ResourceRequestJob', jobFactory);
    jobRegistry = new JobRegistry({});
    workers = new IdentifyableCollection();
    workersRegistry = new WorkersRegistry({ jobRegistry, quantity: 1, workers });
    workersRegistry.initWorkers();
    worker = workers.byIndex(0);
    spyOn(worker, 'perform');
    DummyJob.setSuccessRate(1);

    job = new Job({});

    allocator = new WorkersAllocator({ jobRegistry, workersRegistry });
  });

  afterEach(() => {
    JobFactory.reset();
  });

  describe('when there when there is a single worker and no job', () => {
    it('does not allocate any workers', () => {
      expect(jobRegistry.hasJob()).toBeFalse();

      allocator.allocate();

      expect(worker.job).toBeUndefined();
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeFalse();
      expect(worker.perform).not.toHaveBeenCalled();
    });
  });

  describe('when there when there is a single worker and a single job', () => {
    beforeEach(() => {
      job = jobRegistry.enqueue('ResourceRequestJob', {});
    });

    it('allocates all workers for the jobs', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(workersRegistry.hasIdleWorker()).toBeFalse();
      expect(jobRegistry.hasJob()).toBeFalse();
      expect(worker.perform).toHaveBeenCalled();
    });
  });

  describe('when there when there is a single worker and several jobs', () => {
    beforeEach(() => {
      job = jobRegistry.enqueue('ResourceRequestJob', {});
      jobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      jobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 3 } });
    });

    it('allocates all workers for the jobs they can', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(workersRegistry.hasIdleWorker()).toBeFalse();
      expect(jobRegistry.hasJob()).toBeTrue();
      expect(worker.perform).toHaveBeenCalled();
    });
  });

  describe('when there when there are several workers', () => {
    beforeEach(() => {
      workers = new IdentifyableCollection();
      workersRegistry = new WorkersRegistry({ jobRegistry, quantity: 3, workers });
      workersRegistry.initWorkers();
      worker = workers.byIndex(0);
      spyOn(worker, 'perform');
      allocator = new WorkersAllocator({ jobRegistry, workersRegistry });

      job = jobRegistry.enqueue('ResourceRequestJob', {});
      jobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      jobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 3 } });
    });

    it('allocates all workers for the jobs they can', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(workersRegistry.hasIdleWorker()).toBeFalse();
      expect(jobRegistry.hasJob()).toBeFalse();
      expect(worker.perform).toHaveBeenCalled();
    });
  });

  describe('when there is an idle worker and only a failed (cooling-down) job', () => {
    beforeEach(() => {
      job = jobRegistry.enqueue('ResourceRequestJob', {});
      const picked = jobRegistry.pick();
      jobRegistry.fail(picked);
    });

    it('does not allocate any worker', () => {
      expect(workersRegistry.hasIdleWorker()).toBeTrue();
      expect(jobRegistry.hasJob()).toBeTrue();
      expect(jobRegistry.hasReadyJob()).toBeFalse();

      allocator.allocate();

      expect(worker.job).toBeUndefined();
      expect(worker.perform).not.toHaveBeenCalled();
    });
  });
});