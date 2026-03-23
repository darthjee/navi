import { LockedByOtherWorker } from '../../lib/exceptions/LockedByOtherWorker.js';
import { Job } from '../../lib/models/Job.js';
import { Worker } from '../../lib/models/Worker.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';

describe('JobRegistry', () => {
  let registry;
  let resourceRequest;

  beforeEach(() => {
    registry = new JobRegistry();
    resourceRequest = new ResourceRequest({ url: 'http://example.com', status: 200 });
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
        registry.push(new Job({ payload: {} }));
      });

      it('returns true', () => {
        expect(registry.hasJob()).toBeTrue();
      });
    });
  });

  describe('#push', () => {
    it('adds a job to the queue', () => {
      const job = new Job({ payload: {} });

      registry.push(job);

      expect(registry.hasJob()).toBeTrue();
    });
  });

  describe('#pick', () => {
    describe('when the queue is empty', () => {
      it('returns undefined', () => {
        expect(registry.pick()).toBeUndefined();
      });
    });

    describe('when the queue has jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = new Job({ payload: { id: 1 } });
        job2 = new Job({ payload: { id: 2 } });
        registry.push(job1);
        registry.push(job2);
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

    describe('when the queue has a failed job', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = new Job({ payload: { id: 1 } });
        job2 = new Job({ payload: { id: 2 } });
        registry.fail(job1);
        registry.fail(job2);
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
        job1 = new Job({ payload: { id: 1 } });
        job2 = new Job({ payload: { id: 2 } });
        registry.fail(job1);
        registry.push(job2);
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

        expect(registry.lockedBy).toEqual(worker.id);
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
      const job = new Job({ payload: { id: 1 } });
      registry.push(job);

      const picked = registry.pick();
      expect(picked).toBe(job);

      registry.fail(picked);

      expect(registry.hasJob()).toBeTrue();
      expect(registry.pick()).toEqual(job);
    });

    it('is safe to call with undefined', () => {
      expect(() => registry.fail(undefined)).not.toThrow();
    });
  });
});
