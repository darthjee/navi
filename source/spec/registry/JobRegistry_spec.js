import { LockedByOtherWorker } from '../../lib/exceptions/LockedByOtherWorker.js';
import { Job } from '../../lib/models/Job.js';
import { Worker } from '../../lib/models/Worker.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';
import { Queue } from '../../lib/utils/Queue.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';

describe('JobRegistry', () => {
  let registry;
  let resourceRequest;
  let clients;

  let jobs;
  let failedJobs;
  let finished;
  let processing;

  beforeEach(() => {
    clients = new ClientRegistry();
    jobs = new Queue();
    failedJobs = new Queue();
    finished = new Queue();
    processing = new IdentifyableCollection();
    registry = new JobRegistry({ jobs, failedJobs, finished, processing, clients });
    resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
  });

  describe('#enqueue', () => {
    it('creates and enqueues a job', () => {
      expect(registry.hasJob()).toBeFalse();

      const jobAttributes = { resourceRequest, parameters: { id: 20 } };
      const job = registry.enqueue(jobAttributes);

      expect(job).toBeInstanceOf(Job);
      expect(registry.hasJob()).toBeTrue();
    });
  });

  describe('#hasJob', () => {
    describe('when the queue is empty', () => {
      it('returns false', () => {
        expect(registry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      beforeEach(() => {
        registry.enqueue({});
      });

      it('returns true', () => {
        expect(registry.hasJob()).toBeTrue();
      });
    });
  });

  describe('#pick', () => {
    describe('when the queue is empty', () => {
      it('returns undefined', () => {
        expect(registry.pick()).toBeUndefined();
      });

      it('does not add anything to processing', () => {
        registry.pick();

        expect(processing.hasAny()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = registry.enqueue({ parameters: { value: 1 } });
        job2 = registry.enqueue({ parameters: { value: 2 } });
      });

      it('returns the first job', () => {
        expect(registry.pick()).toEqual(job1);
      });

      it('removes the job from the queue', () => {
        registry.pick();

        expect(registry.pick()).toEqual(job2);
      });

      it('decreases the queue size', () => {
        registry.pick();

        expect(registry.hasJob()).toBeTrue();

        registry.pick();

        expect(registry.hasJob()).toBeFalse();
      });

      it('adds the picked job to processing', () => {
        const job = registry.pick();

        expect(processing.has(job.id)).toBeTrue();
      });
    });

    describe('when the queue has a failed job', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = registry.enqueue({ parameters: { value: 1 } });
        job2 = registry.enqueue({ parameters: { value: 2 } });
      });

      it('returns the first job', () => {
        expect(registry.pick()).toEqual(job1);
      });

      it('removes the job from the queue', () => {
        registry.pick();

        expect(registry.pick()).toEqual(job2);
      });

      it('decreases the queue size', () => {
        registry.pick();

        expect(registry.hasJob()).toBeTrue();

        registry.pick();

        expect(registry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has failed and not failed jobs', () => {
      let job1, job2;

      beforeEach(() => {
        registry.enqueue({ parameters: { value: 1 } });
        job1 = registry.pick();
        job2 = registry.enqueue({ parameters: { value: 2 } });
        registry.fail(job1);
      });

      it('returns the first not failed job', () => {
        expect(registry.pick()).toEqual(job2);
      });

      it('removes the job from the queue', () => {
        registry.pick();

        expect(registry.pick()).toEqual(job1);
      });

      it('decreases the queue size', () => {
        registry.pick();

        expect(registry.hasJob()).toBeTrue();

        registry.pick();

        expect(registry.hasJob()).toBeFalse();
      });
    });
  });

  describe('#lock', () => {
    let worker;

    beforeEach(() => {
      worker = new Worker({ id: 1, jobRegistry: registry });
    });

    describe('when the registry is not locked', () => {
      it('sets lockedBy to the worker id', () => {
        registry.lock(worker);

        expect(registry.hasLock(worker)).toBeTrue();
      });
    });

    describe('when the registry is already locked', () => {
      beforeEach(() => {
        registry.lock(worker);
      });

      it('throws LockedByOtherWorker', () => {
        const otherWorker = new Worker({ id: 2, jobRegistry: registry });

        expect(() => registry.lock(otherWorker)).toThrowError(LockedByOtherWorker);
      });
    });
  });

  describe('#hasLock', () => {
    let worker;

    beforeEach(() => {
      worker = new Worker({ id: 1, jobRegistry: registry });
    });

    describe('when the worker holds the lock', () => {
      beforeEach(() => {
        registry.lock(worker);
      });

      it('returns true', () => {
        expect(registry.hasLock(worker)).toBeTrue();
      });
    });

    describe('when another worker holds the lock', () => {
      beforeEach(() => {
        registry.lock(worker);
      });

      it('returns false', () => {
        const otherWorker = new Worker({ id: 2, jobRegistry: registry });

        expect(registry.hasLock(otherWorker)).toBeFalse();
      });
    });

    describe('when the registry is not locked', () => {
      it('returns false', () => {
        expect(registry.hasLock(worker)).toBeFalse();
      });
    });
  });

  describe('#fail', () => {
    it('does not re-queue a picked job', () => {
      const job = registry.enqueue({ parameters: { value: 1 } });

      const picked = registry.pick();
      expect(picked).toBe(job);

      registry.fail(picked);

      expect(registry.hasJob()).toBeTrue();
      expect(registry.pick()).toEqual(job);
    });

    it('removes the job from processing', () => {
      const job = registry.enqueue({ parameters: { value: 1 } });
      const picked = registry.pick();

      expect(processing.has(picked.id)).toBeTrue();

      registry.fail(job);

      expect(processing.has(picked.id)).toBeFalse();
    });
  });

  describe('#finish', () => {
    it('does not re-queue a picked job', () => {
      const job = registry.enqueue({ parameters: { value: 1 } });

      const picked = registry.pick();
      expect(picked).toBe(job);

      registry.finish(picked);

      expect(registry.hasJob()).toBeFalse();
      expect(registry.pick()).toBeUndefined();
    });

    it('is safe to call with undefined', () => {
      expect(() => registry.finish(undefined)).not.toThrow();
    });

    it('removes the job from processing', () => {
      const job = registry.enqueue({ parameters: { value: 1 } });
      const picked = registry.pick();

      expect(processing.has(picked.id)).toBeTrue();

      registry.finish(job);

      expect(processing.has(picked.id)).toBeFalse();
    });
  });
});
