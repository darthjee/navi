import { JobIndexSerializer } from '../../../lib/serializers/JobIndexSerializer.js';

describe('JobIndexSerializer', () => {
  const status = 'enqueued';

  describe('.serialize', () => {
    describe('when given a single job object', () => {
      const url = '/items.json';
      const job = {
        id: 'abc-1',
        _attempts: 2,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url },
      };

      it('returns a plain serialized object with id, status, attempts, jobClass, and url', () => {
        expect(JobIndexSerializer.serialize(job, { status })).toEqual({
          id: 'abc-1',
          status: 'enqueued',
          attempts: 2,
          jobClass: 'ResourceRequestJob',
          url,
        });
      });
    });

    describe('when given an array of job objects', () => {
      const jobA = { id: 'a1', _attempts: 0, constructor: { name: 'AssetDownloadJob' } };
      const jobB = { id: 'b2', _attempts: 1, constructor: { name: 'HtmlParseJob' } };

      it('returns an array of serialized objects', () => {
        expect(JobIndexSerializer.serialize([jobA, jobB], { status: 'processing' })).toEqual([
          { id: 'a1', status: 'processing', attempts: 0, jobClass: 'AssetDownloadJob' },
          { id: 'b2', status: 'processing', attempts: 1, jobClass: 'HtmlParseJob' },
        ]);
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(JobIndexSerializer.serialize([], { status })).toEqual([]);
      });
    });
  });

  describe('regression against error fields', () => {
    describe('when serializing a failed job with a recorded error', () => {
      const error = new Error('connection refused');
      const job = {
        id: 'fail-reg',
        _attempts: 2,
        constructor: { name: 'ResourceRequestJob' },
        lastError: error,
      };

      it('does not include lastError in index output', () => {
        const result = JobIndexSerializer.serialize(job, { status: 'failed' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace in index output', () => {
        const result = JobIndexSerializer.serialize(job, { status: 'failed' });
        expect(result.backtrace).toBeUndefined();
      });
    });

    describe('when serializing a dead job with a recorded error', () => {
      const error = new Error('fatal timeout');
      const job = {
        id: 'dead-reg',
        _attempts: 3,
        constructor: { name: 'ActionProcessingJob' },
        lastError: error,
      };

      it('does not include lastError in index output', () => {
        const result = JobIndexSerializer.serialize(job, { status: 'dead' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace in index output', () => {
        const result = JobIndexSerializer.serialize(job, { status: 'dead' });
        expect(result.backtrace).toBeUndefined();
      });
    });
  });
});
