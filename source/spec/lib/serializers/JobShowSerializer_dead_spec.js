import { JobShowSerializer } from '../../../lib/serializers/JobShowSerializer.js';

describe('JobShowSerializer', () => {
  describe('.serialize', () => {
    describe('when status is dead without a recorded error', () => {
      const job = {
        id: 'dead-no-err',
        _attempts: 3,
        constructor: { name: 'ActionProcessingJob' },
        arguments: { item: { id: 7 } },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('returns only the common fields', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result).toEqual({
          id: 'dead-no-err',
          status: 'dead',
          attempts: 3,
          jobClass: 'ActionProcessingJob',
          arguments: { item: { id: 7 } },
        });
      });

      it('does not include lastError', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.backtrace).toBeUndefined();
      });
    });

    describe('when status is dead with a recorded error', () => {
      const error = new Error('fatal timeout');
      const job = {
        id: 'dead-err',
        _attempts: 3,
        constructor: { name: 'ActionProcessingJob' },
        arguments: { item: { id: 9 } },
        maxRetries: 3,
        readyBy: 0,
        lastError: error,
      };

      it('includes lastError with the exception message', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.lastError).toBe('fatal timeout');
      });

      it('includes a non-empty backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.backtrace).toBeTruthy();
      });

      it('does not include remainingAttempts', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.remainingAttempts).toBeUndefined();
      });

      it('does not include readyInMs', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.readyInMs).toBeUndefined();
      });
    });

    describe('when attempts exceed maxRetries', () => {
      const job = {
        id: 'over-1',
        _attempts: 5,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/test' },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('clamps remainingAttempts to 0', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.remainingAttempts).toBe(0);
      });
    });

    describe('when given an array of jobs', () => {
      const jobA = {
        id: 'a1',
        _attempts: 0,
        constructor: { name: 'HtmlParseJob' },
        arguments: { assetCount: 3 },
        maxRetries: 1,
        readyBy: 0,
        lastError: null,
      };
      const jobB = {
        id: 'b2',
        _attempts: 1,
        constructor: { name: 'AssetDownloadJob' },
        arguments: { url: 'https://cdn.example.com/style.css', clientName: 'default' },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('serializes each job', () => {
        const results = JobShowSerializer.serialize([jobA, jobB], { status: 'processing' });
        expect(results.length).toBe(2);
        expect(results[0].jobClass).toBe('HtmlParseJob');
        expect(results[1].jobClass).toBe('AssetDownloadJob');
      });
    });
  });
});
