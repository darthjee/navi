import { Job } from '../../lib/background/Job.js';
import { JobRegistry } from '../../lib/background/JobRegistry.js';

const error = new Error('test error');

describe('JobRegistry', () => {
  afterEach(() => {
    JobRegistry.reset();
  });

  describe('.ensureBuild', () => {
    describe('when the singleton has not been built', () => {
      it('builds and returns the instance', () => {
        const instance = JobRegistry.ensureBuild({ cooldown: 1000, maxRetries: 2 });

        expect(instance).toBeDefined();
      });

      it('leaves the facade usable afterwards', () => {
        JobRegistry.ensureBuild({ cooldown: 1000 });

        expect(JobRegistry.hasJob()).toBeFalse();
        expect(JobRegistry.stats()).toEqual(jasmine.objectContaining({ enqueued: 0 }));
      });
    });

    describe('when the singleton is already built', () => {
      let firstInstance;

      beforeEach(() => {
        firstInstance = JobRegistry.build({ cooldown: 1000 });
      });

      it('returns the same instance', () => {
        expect(JobRegistry.ensureBuild()).toBe(firstInstance);
      });

      it('does not throw', () => {
        expect(() => JobRegistry.ensureBuild({ cooldown: 5000 })).not.toThrow();
      });

      it('ignores the new options', () => {
        expect(JobRegistry.ensureBuild({ cooldown: 5000 })).toBe(firstInstance);
      });
    });
  });

  describe('.fail', () => {
    describe('when the job declares neither its own maxRetries nor cooldown', () => {
      describe('and fewer attempts than the job default maxRetries (3) have been made', () => {
        let job;

        beforeEach(() => {
          // Registry configured maxRetries (1) is intentionally lower than the job's own
          // default (3), to prove it no longer drives exhaustion (regression coverage).
          JobRegistry.build({ cooldown: 5000, maxRetries: 1 });
          job = new Job({ id: 'job-fallback-not-exhausted' });
          try { job._fail(error); } catch (_) { /* expected */ }
          try { job._fail(error); } catch (_) { /* expected */ }
        });

        it('re-queues the job as failed, ignoring the registry configured maxRetries', () => {
          JobRegistry.fail(job);

          expect(JobRegistry.jobById('job-fallback-not-exhausted').status).toEqual('failed');
        });

        it('falls back to the registry configured cooldown', () => {
          spyOn(Date, 'now').and.returnValue(1000);
          JobRegistry.fail(job);

          expect(job.readyBy).toEqual(1000 + 5000);
        });
      });

      describe('and the job default maxRetries (3) attempts have been made', () => {
        let job;

        beforeEach(() => {
          JobRegistry.build({ cooldown: 5000, maxRetries: 1 });
          job = new Job({ id: 'job-fallback-exhausted' });
          try { job._fail(error); } catch (_) { /* expected */ }
          try { job._fail(error); } catch (_) { /* expected */ }
          try { job._fail(error); } catch (_) { /* expected */ }
        });

        it('dead-letters the job using its own default maxRetries, ignoring the registry configured value', () => {
          JobRegistry.fail(job);

          expect(JobRegistry.jobById('job-fallback-exhausted').status).toEqual('dead');
        });
      });
    });

    describe('when the job declares its own maxRetries', () => {
      let job;

      beforeEach(() => {
        JobRegistry.build({ cooldown: 5000, maxRetries: 3 });
        job = new Job({ id: 'job-own-max-retries', maxRetries: 1 });
      });

      it('dead-letters at the job own maxRetries rather than the registry configured global', () => {
        try { job._fail(error); } catch (_) { /* expected */ }
        JobRegistry.fail(job);

        expect(JobRegistry.jobById('job-own-max-retries').status).toEqual('dead');
      });
    });

    describe('when the job declares its own cooldown', () => {
      let job;

      beforeEach(() => {
        JobRegistry.build({ cooldown: 5000, maxRetries: 3 });
        job = new Job({ id: 'job-own-cooldown', cooldown: 100 });
      });

      it('applies the job own cooldown rather than the registry configured global', () => {
        spyOn(Date, 'now').and.returnValue(1000);
        try { job._fail(error); } catch (_) { /* expected */ }
        JobRegistry.fail(job);

        expect(job.readyBy).toEqual(1000 + 100);
      });
    });
  });
});
