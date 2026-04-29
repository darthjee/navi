import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  let resourceRequest;

  JobRegistryUtils.setup();

  beforeEach(() => {
    resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
  });

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

    describe('when a job has been enqueued', () => {
      let job;

      beforeEach(() => {
        job = JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
      });

      it('returns the job in the enqueued list', () => {
        expect(JobRegistry.jobsByStatus('enqueued')).toEqual([job]);
      });

      it('returns an empty array for other statuses', () => {
        expect(JobRegistry.jobsByStatus('processing')).toEqual([]);
        expect(JobRegistry.jobsByStatus('finished')).toEqual([]);
        expect(JobRegistry.jobsByStatus('dead')).toEqual([]);
      });
    });

    describe('when a job is being processed', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
      });

      it('returns the job in the processing list', () => {
        expect(JobRegistry.jobsByStatus('processing')).toEqual([job]);
      });

      it('returns an empty array for enqueued', () => {
        expect(JobRegistry.jobsByStatus('enqueued')).toEqual([]);
      });
    });

    describe('when a job has finished', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        JobRegistry.finish(job);
      });

      it('returns the job in the finished list', () => {
        expect(JobRegistry.jobsByStatus('finished')).toEqual([job]);
      });
    });

    describe('when a non-exhausted job has failed', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        JobRegistry.fail(job);
      });

      it('returns the job in the failed list', () => {
        expect(JobRegistry.jobsByStatus('failed')).toEqual([job]);
      });
    });

    describe('when a failed job is promoted to retryQueue', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();
      });

      it('returns the job in the retryQueue list', () => {
        expect(JobRegistry.jobsByStatus('retryQueue')).toEqual([job]);
      });
    });

    describe('when an exhausted job has failed', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        JobRegistry.fail(job);
      });

      it('returns the job in the dead list', () => {
        expect(JobRegistry.jobsByStatus('dead')).toEqual([job]);
      });
    });
  });

  describe('.jobById', () => {
    describe('when the job does not exist', () => {
      it('returns null', () => {
        expect(JobRegistry.jobById('nonexistent-id')).toBeNull();
      });
    });

    describe('when a job has been enqueued', () => {
      let job;

      beforeEach(() => {
        job = JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
      });

      it('returns the job with enqueued status', () => {
        expect(JobRegistry.jobById(job.id)).toEqual({ job, status: 'enqueued' });
      });
    });

    describe('when a job is being processed', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
      });

      it('returns the job with processing status', () => {
        expect(JobRegistry.jobById(job.id)).toEqual({ job, status: 'processing' });
      });
    });

    describe('when a job has finished', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        JobRegistry.finish(job);
      });

      it('returns the job with finished status', () => {
        expect(JobRegistry.jobById(job.id)).toEqual({ job, status: 'finished' });
      });
    });

    describe('when a non-exhausted job has failed', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        JobRegistry.fail(job);
      });

      it('returns the job with failed status', () => {
        expect(JobRegistry.jobById(job.id)).toEqual({ job, status: 'failed' });
      });
    });

    describe('when an exhausted job has failed', () => {
      let job;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
        job = JobRegistry.pick();
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        try { job._fail(new Error()); } catch { /* expected */ }
        JobRegistry.fail(job);
      });

      it('returns the job with dead status', () => {
        expect(JobRegistry.jobById(job.id)).toEqual({ job, status: 'dead' });
      });
    });
  });
});
