import { Job } from '../../lib/models/Job.js';

describe('Job', () => {
  let job;

  beforeEach(() => {
    job = new Job({ id: 'test-id' });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('test-id');
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

  describe('#exhausted', () => {
    const error = new Error('test error');

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('returns false with fewer than 3 attempts', () => {
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      expect(job.exhausted()).toBeFalse();
    });

    it('returns true after 3 attempts', () => {
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      expect(job.exhausted()).toBeTrue();
    });

    it('remains true beyond 3 attempts', () => {
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      expect(job.exhausted()).toBeTrue();
    });
  });

  describe('#_fail', () => {
    const error = new Error('test error');

    it('sets lastError', () => {
      expect(job.lastError).toBeUndefined();
      try { job._fail(error); } catch (_) {}
      expect(job.lastError).toEqual(error);
    });

    it('rethrows the error', () => {
      expect(() => job._fail(error)).toThrow(error);
    });
  });
});
