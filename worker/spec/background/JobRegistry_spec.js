import { JobRegistry } from '../../lib/background/JobRegistry.js';

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
});
