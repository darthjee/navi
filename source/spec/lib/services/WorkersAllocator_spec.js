import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { WorkersAllocator } from '../../../lib/services/WorkersAllocator.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ActionProcessingJob } from '../../../lib/models/ActionProcessingJob.js';

describe('WorkersAllocator', () => {
  let allocator;
  let job;
  let worker;
  let workers;

  let jobFactory;

  beforeEach(() => {
    Logger.suppress();
    JobRegistry.build({});
    jobFactory = new DummyJobFactory();
    JobFactory.registry('ResourceRequestJob', jobFactory);
    JobFactory.build('Action', { klass: ActionProcessingJob });
    workers = new IdentifyableCollection();
    WorkersRegistry.build({ quantity: 1, workers });
    WorkersRegistry.initWorkers();
    worker = workers.byIndex(0);
    spyOn(worker, 'perform');
    DummyJob.setSuccessRate(1);

    job = new Job({});

    allocator = new WorkersAllocator();
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
  });

  describe('when there when there is a single worker and no job', () => {
    it('does not allocate any workers', () => {
      expect(JobRegistry.hasJob()).toBeFalse();

      allocator.allocate();

      expect(worker.job).toBeUndefined();
      expect(WorkersRegistry.hasIdleWorker()).toBeTrue();
      expect(JobRegistry.hasJob()).toBeFalse();
      expect(worker.perform).not.toHaveBeenCalled();
    });
  });

  describe('when there when there is a single worker and a single job', () => {
    beforeEach(() => {
      job = JobRegistry.enqueue('ResourceRequestJob', {});
    });

    it('allocates all workers for the jobs', () => {
      expect(WorkersRegistry.hasIdleWorker()).toBeTrue();
      expect(JobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(WorkersRegistry.hasIdleWorker()).toBeFalse();
      expect(JobRegistry.hasJob()).toBeFalse();
      expect(worker.perform).toHaveBeenCalled();
    });
  });

  describe('when there when there is a single worker and several jobs', () => {
    beforeEach(() => {
      job = JobRegistry.enqueue('ResourceRequestJob', {});
      JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 3 } });
    });

    it('allocates all workers for the jobs they can', () => {
      expect(WorkersRegistry.hasIdleWorker()).toBeTrue();
      expect(JobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(WorkersRegistry.hasIdleWorker()).toBeFalse();
      expect(JobRegistry.hasJob()).toBeTrue();
      expect(worker.perform).toHaveBeenCalled();
    });
  });

  describe('when there when there are several workers', () => {
    beforeEach(() => {
      WorkersRegistry.reset();
      workers = new IdentifyableCollection();
      WorkersRegistry.build({ quantity: 3, workers });
      WorkersRegistry.initWorkers();
      worker = workers.byIndex(0);
      spyOn(worker, 'perform');

      job = JobRegistry.enqueue('ResourceRequestJob', {});
      JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 3 } });
    });

    it('allocates all workers for the jobs they can', () => {
      expect(WorkersRegistry.hasIdleWorker()).toBeTrue();
      expect(JobRegistry.hasJob()).toBeTrue();

      allocator.allocate();

      expect(worker.job).toEqual(job);
      expect(WorkersRegistry.hasIdleWorker()).toBeFalse();
      expect(JobRegistry.hasJob()).toBeFalse();
      expect(worker.perform).toHaveBeenCalled();
    });
  });

  xdescribe('when there is an idle worker and only a failed (cooling-down) job', () => {
    beforeEach(() => {
      job = JobRegistry.enqueue('ResourceRequestJob', {});
      const picked = JobRegistry.pick();
      JobRegistry.fail(picked);
    });

    it('does not allocate any worker', () => {
      expect(WorkersRegistry.hasIdleWorker()).toBeTrue();
      expect(JobRegistry.hasJob()).toBeTrue();
      expect(JobRegistry.hasReadyJob()).toBeFalse();

      allocator.allocate();

      expect(worker.job).toBeUndefined();
      expect(worker.perform).not.toHaveBeenCalled();
    });
  });
});