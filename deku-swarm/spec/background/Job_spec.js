import { Job } from '../../lib/background/Job.js';

describe('Job', () => {
  let job;

  beforeEach(() => {
    job = new Job({ id: 'test-id' });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('test-id');
    });

    describe('when no params are given', () => {
      it('does not raise', () => {
        expect(() => new Job()).not.toThrow();
      });
    });
  });

  describe('#perform', () => {
    it('throws when not overridden', async () => {
      await expectAsync(job.perform()).toBeRejectedWithError(
        'You must implement the perform method in a subclass'
      );
    });
  });

  describe('#isReadyBy', () => {
    describe('when no cooldown was applied (default)', () => {
      it('returns true', () => {
        expect(job.isReadyBy(Date.now())).toBeTrue();
      });
    });

    describe('when cooldown is in the past', () => {
      beforeEach(() => { job.applyCooldown(-1000); });

      it('returns true', () => {
        expect(job.isReadyBy(Date.now())).toBeTrue();
      });
    });

    describe('when cooldown is in the future', () => {
      beforeEach(() => { job.applyCooldown(10_000); });

      it('returns false', () => {
        expect(job.isReadyBy(Date.now())).toBeFalse();
      });
    });
  });

  describe('#maxRetries', () => {
    it('returns 3 by default', () => {
      expect(job.maxRetries).toBe(3);
    });

    describe('when a custom maxRetries is passed to the constructor', () => {
      beforeEach(() => {
        job = new Job({ id: 'test-id', maxRetries: 7 });
      });

      it('returns the custom value', () => {
        expect(job.maxRetries).toBe(7);
      });
    });

    describe('when a subclass overrides the getter', () => {
      class CustomJob extends Job {
        get maxRetries() {
          return 1;
        }
      }

      beforeEach(() => {
        job = new CustomJob({ id: 'test-id', maxRetries: 7 });
      });

      it('the subclass getter wins over the constructor value', () => {
        expect(job.maxRetries).toBe(1);
      });
    });
  });

  describe('#cooldown', () => {
    it('returns undefined by default', () => {
      expect(job.cooldown).toBeUndefined();
    });

    describe('when a custom cooldown is passed to the constructor', () => {
      beforeEach(() => {
        job = new Job({ id: 'test-id', cooldown: 12_345 });
      });

      it('returns the custom value', () => {
        expect(job.cooldown).toBe(12_345);
      });
    });
  });

  describe('#exhausted', () => {
    const error = new Error('test error');

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('returns false with fewer than 3 attempts', () => {
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      expect(job.exhausted()).toBeFalse();
    });

    it('returns true after 3 attempts', () => {
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      expect(job.exhausted()).toBeTrue();
    });

    it('remains true beyond 3 attempts', () => {
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      expect(job.exhausted()).toBeTrue();
    });

    describe('when a custom maxRetries is provided', () => {
      it('returns false with fewer than maxRetries attempts', () => {
        try { job._fail(error); } catch (_) { /* expected */ }
        expect(job.exhausted(2)).toBeFalse();
      });

      it('returns true after maxRetries attempts', () => {
        try { job._fail(error); } catch (_) { /* expected */ }
        try { job._fail(error); } catch (_) { /* expected */ }
        expect(job.exhausted(2)).toBeTrue();
      });
    });
  });

  describe('#_fail', () => {
    const error = new Error('test error');

    it('sets lastError', () => {
      expect(job.lastError).toBeUndefined();
      try { job._fail(error); } catch (_) { /* expected */ }
      expect(job.lastError).toEqual(error);
    });

    it('rethrows the error', () => {
      expect(() => job._fail(error)).toThrow(error);
    });
  });

  describe('#_attempts', () => {
    const error = new Error('test error');

    it('returns 0 before any failures', () => {
      expect(job._attempts).toEqual(0);
    });

    it('returns 1 after one failure', () => {
      try { job._fail(error); } catch (_) { /* expected */ }
      expect(job._attempts).toEqual(1);
    });

    it('increments with each failure', () => {
      try { job._fail(error); } catch (_) { /* expected */ }
      try { job._fail(error); } catch (_) { /* expected */ }
      expect(job._attempts).toEqual(2);
    });
  });
});
