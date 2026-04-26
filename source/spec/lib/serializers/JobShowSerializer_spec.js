import { JobShowSerializer } from '../../../lib/serializers/JobShowSerializer.js';

describe('JobShowSerializer', () => {
  const status = 'processing';

  describe('.serialize', () => {
    describe('when given a single job with no cooldown pending', () => {
      const job = {
        id: 'abc-1',
        _attempts: 1,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/items.json', parameters: {} },
        maxRetries: 3,
        readyBy: 0,
      };

      it('returns a serialized object with all show fields', () => {
        const result = JobShowSerializer.serialize(job, { status });
        expect(result).toEqual({
          id: 'abc-1',
          status: 'processing',
          attempts: 1,
          jobClass: 'ResourceRequestJob',
          arguments: { url: '/items.json', parameters: {} },
          remainingAttempts: 2,
          readyInMs: 0,
        });
      });
    });

    describe('when the job has a future readyBy timestamp', () => {
      it('returns a positive readyInMs', () => {
        const futureTime = Date.now() + 5000;
        const job = {
          id: 'xyz',
          _attempts: 0,
          constructor: { name: 'AssetDownloadJob' },
          arguments: { url: 'https://cdn.example.com/app.css', clientName: 'cdn' },
          maxRetries: 3,
          readyBy: futureTime,
        };

        const result = JobShowSerializer.serialize(job, { status: 'failed' });
        expect(result.readyInMs).toBeGreaterThan(0);
        expect(result.readyInMs).toBeLessThanOrEqual(5000);
      });
    });

    describe('when the job has maxRetries of 1 (e.g. ActionProcessingJob)', () => {
      const job = {
        id: 'act-1',
        _attempts: 1,
        constructor: { name: 'ActionProcessingJob' },
        arguments: { item: { id: 7 } },
        maxRetries: 1,
        readyBy: 0,
      };

      it('returns remainingAttempts of 0', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
        expect(result.remainingAttempts).toBe(0);
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
      };

      it('clamps remainingAttempts to 0', () => {
        const result = JobShowSerializer.serialize(job, { status: 'dead' });
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
      };
      const jobB = {
        id: 'b2',
        _attempts: 1,
        constructor: { name: 'AssetDownloadJob' },
        arguments: { url: 'https://cdn.example.com/style.css', clientName: 'default' },
        maxRetries: 3,
        readyBy: 0,
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
