import { Job } from '../../../lib/background/Job.js';
import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { WorkersAllocator } from '../../../lib/services/WorkersAllocator.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';

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
      workers.list().forEach((w) => spyOn(w, 'perform'));

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

  describe('when there is an idle worker and only a failed (cooling-down) job', () => {
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

  describe('when pick returns null unexpectedly', () => {
    beforeEach(() => {
      job = JobRegistry.enqueue('ResourceRequestJob', {});
      spyOn(JobRegistry, 'pick').and.returnValue(undefined);
    });

    it('does not throw and does not allocate', () => {
      expect(() => allocator._allocateNext()).not.toThrow();
      expect(worker.job).toBeUndefined();
      expect(worker.perform).not.toHaveBeenCalled();
    });

    it('does not get a worker', () => {
      spyOn(WorkersRegistry, 'getIdleWorker');

      allocator._allocateNext();

      expect(WorkersRegistry.getIdleWorker).not.toHaveBeenCalled();
    });
  });

  describe('when getIdleWorker returns null unexpectedly', () => {
    beforeEach(() => {
      job = JobRegistry.enqueue('ResourceRequestJob', {});
      spyOn(WorkersRegistry, 'getIdleWorker').and.returnValue(null);
    });

    it('does not throw', () => {
      expect(() => allocator._allocateNext()).not.toThrow();
    });

    it('does not allocate any worker', () => {
      allocator._allocateNext();

      expect(worker.job).toBeUndefined();
      expect(worker.perform).not.toHaveBeenCalled();
    });

    it('requeues the job', () => {
      allocator._allocateNext();

      expect(JobRegistry.hasReadyJob()).toBeTrue();
    });
  });
});