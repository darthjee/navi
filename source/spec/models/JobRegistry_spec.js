import { Job } from '../../lib/models/Job.js';
import { JobRegistry } from '../../lib/models/JobRegistry.js';

describe('JobRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new JobRegistry();
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
  });
});
