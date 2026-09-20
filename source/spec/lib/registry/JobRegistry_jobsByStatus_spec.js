import { JobRegistry } from 'deku-swarm';
import { JobRegistryScenarios } from '../../support/utils/JobRegistryScenarios.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  const ctx = JobRegistryUtils.setup();
  const attributes = () => ({ resourceRequest: ctx.resourceRequest, parameters: {} });

  describe('.jobsByStatus', () => {
    describe('when the status is unknown', () => {
      it('returns an empty array', () => {
        expect(JobRegistry.jobsByStatus('unknown')).toEqual([]);
      });
    });

    describe('when no jobs have been added', () => {
      it('returns an empty array for enqueued', () => {
        expect(JobRegistry.jobsByStatus('enqueued')).toEqual([]);
      });
    });

    JobRegistryScenarios.all().forEach(({ status, description, setup }) => {
      describe(`when ${description}`, () => {
        let job;

        beforeEach(() => {
          job = setup(attributes());
        });

        it(`returns the job in the ${status} list`, () => {
          expect(JobRegistry.jobsByStatus(status)).toEqual([job]);
        });
      });
    });

    describe('when a job has been enqueued', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', attributes());
      });

      it('returns an empty array for other statuses', () => {
        expect(JobRegistry.jobsByStatus('processing')).toEqual([]);
        expect(JobRegistry.jobsByStatus('finished')).toEqual([]);
        expect(JobRegistry.jobsByStatus('dead')).toEqual([]);
      });
    });

    describe('when a job is being processed', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', attributes());
        JobRegistry.pick();
      });

      it('returns an empty array for enqueued', () => {
        expect(JobRegistry.jobsByStatus('enqueued')).toEqual([]);
      });
    });
  });

  describe('.jobById', () => {
    describe('when the job does not exist', () => {
      it('returns null', () => {
        expect(JobRegistry.jobById('nonexistent-id')).toBeNull();
      });
    });

    JobRegistryScenarios.all().filter(({ status }) => status !== 'retryQueue').forEach(({ status, description, setup }) => {
      describe(`when ${description}`, () => {
        let job;

        beforeEach(() => {
          job = setup(attributes());
        });

        it(`returns the job with ${status} status`, () => {
          expect(JobRegistry.jobById(job.id)).toEqual({ job, status });
        });
      });
    });
  });
});
