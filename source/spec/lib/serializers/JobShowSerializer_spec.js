import { JobShowSerializer } from '../../../lib/serializers/JobShowSerializer.js';

describe('JobShowSerializer', () => {
  describe('.serialize', () => {
    describe('when status is enqueued', () => {
      const job = {
        id: 'enq-1',
        _attempts: 0,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/items.json', parameters: {} },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('returns id, status, attempts, jobClass, arguments, remainingAttempts', () => {
        const result = JobShowSerializer.serialize(job, { status: 'enqueued' });
        expect(result).toEqual({
          id: 'enq-1',
          status: 'enqueued',
          attempts: 0,
          jobClass: 'ResourceRequestJob',
          arguments: { url: '/items.json', parameters: {} },
          remainingAttempts: 3,
        });
      });

      it('does not include readyInMs', () => {
        const result = JobShowSerializer.serialize(job, { status: 'enqueued' });
        expect(result.readyInMs).toBeUndefined();
      });

      it('does not include lastError', () => {
        const result = JobShowSerializer.serialize(job, { status: 'enqueued' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'enqueued' });
        expect(result.backtrace).toBeUndefined();
      });
    });

    describe('when status is processing', () => {
      const job = {
        id: 'proc-1',
        _attempts: 1,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/items.json', parameters: {} },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('returns id, status, attempts, jobClass, arguments, remainingAttempts', () => {
        const result = JobShowSerializer.serialize(job, { status: 'processing' });
        expect(result).toEqual({
          id: 'proc-1',
          status: 'processing',
          attempts: 1,
          jobClass: 'ResourceRequestJob',
          arguments: { url: '/items.json', parameters: {} },
          remainingAttempts: 2,
        });
      });

      it('does not include readyInMs', () => {
        const result = JobShowSerializer.serialize(job, { status: 'processing' });
        expect(result.readyInMs).toBeUndefined();
      });

      it('does not include lastError', () => {
        const result = JobShowSerializer.serialize(job, { status: 'processing' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'processing' });
        expect(result.backtrace).toBeUndefined();
      });
    });

    describe('when status is failed without a recorded error', () => {
      const job = {
        id: 'fail-no-err',
        _attempts: 1,
        constructor: { name: 'AssetDownloadJob' },
        arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('returns common fields, remainingAttempts, and readyInMs', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result).toEqual({
          id: 'fail-no-err',
          status: 'failed',
          attempts: 1,
          jobClass: 'AssetDownloadJob',
          arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
          remainingAttempts: 2,
          readyInMs: 0,
        });
      });

      it('does not include lastError', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.backtrace).toBeUndefined();
      });
    });

    describe('when status is failed with a recorded error', () => {
      const error = new Error('connection refused');
      const job = {
        id: 'fail-err',
        _attempts: 2,
        constructor: { name: 'AssetDownloadJob' },
        arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
        maxRetries: 3,
        readyBy: 0,
        lastError: error,
      };

      it('includes lastError with the exception message', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.lastError).toBe('connection refused');
      });

      it('includes a non-empty backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.backtrace).toBeTruthy();
      });

      it('still includes remainingAttempts and readyInMs', () => {
        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.remainingAttempts).toBe(1);
        expect(result.readyInMs).toBe(0);
      });
    });

    describe('when status is failed with a future readyBy timestamp', () => {
      it('returns a positive readyInMs', () => {
        const futureTime = Date.now() + 5000;
        const job = {
          id: 'xyz',
          _attempts: 0,
          constructor: { name: 'AssetDownloadJob' },
          arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
          maxRetries: 3,
          readyBy: futureTime,
          lastError: null,
        };

        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.readyInMs).toBeGreaterThan(0);
        expect(result.readyInMs).toBeLessThanOrEqual(5000);
      });
    });

    describe('when status is finished', () => {
      const job = {
        id: 'fin-1',
        _attempts: 2,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/done.json', parameters: {} },
        maxRetries: 3,
        readyBy: 0,
        lastError: null,
      };

      it('returns only the common fields', () => {
        const result = JobShowSerializer.serialize(job, { status: 'finished' });
        expect(result).toEqual({
          id: 'fin-1',
          status: 'finished',
          attempts: 2,
          jobClass: 'ResourceRequestJob',
          arguments: { url: '/done.json', parameters: {} },
        });
      });

      it('does not include remainingAttempts', () => {
        const result = JobShowSerializer.serialize(job, { status: 'finished' });
        expect(result.remainingAttempts).toBeUndefined();
      });

      it('does not include readyInMs', () => {
        const result = JobShowSerializer.serialize(job, { status: 'finished' });
        expect(result.readyInMs).toBeUndefined();
      });

      it('does not include lastError', () => {
        const result = JobShowSerializer.serialize(job, { status: 'finished' });
        expect(result.lastError).toBeUndefined();
      });

      it('does not include backtrace', () => {
        const result = JobShowSerializer.serialize(job, { status: 'finished' });
        expect(result.backtrace).toBeUndefined();
      });
    });

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
        arguments: { url: '/test', parameters: {} },
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
