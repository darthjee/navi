import { Job } from 'deku-swarm';
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
          endedAt: null,
          url,
        });
      });
    });

    describe('when given an array of job objects', () => {
      const jobA = { id: 'a1', _attempts: 0, constructor: { name: 'AssetDownloadJob' } };
      const jobB = { id: 'b2', _attempts: 1, constructor: { name: 'HtmlParseJob' } };

      it('returns an array of serialized objects', () => {
        expect(JobIndexSerializer.serialize([jobA, jobB], { status: 'processing' })).toEqual([
          { id: 'a1', status: 'processing', attempts: 0, jobClass: 'AssetDownloadJob', endedAt: null },
          { id: 'b2', status: 'processing', attempts: 1, jobClass: 'HtmlParseJob', endedAt: null },
        ]);
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(JobIndexSerializer.serialize([], { status })).toEqual([]);
      });
    });

    describe('when given a downstream job with originUrl', () => {
      const originUrl = 'https://example.com/items.json';
      const job = {
        id: 'ap-1',
        _attempts: 0,
        constructor: { name: 'ActionProcessingJob' },
        arguments: { item: { id: 1 }, originUrl },
      };

      it('includes url from originUrl', () => {
        expect(JobIndexSerializer.serialize(job, { status })).toEqual({
          id: 'ap-1',
          status,
          attempts: 0,
          jobClass: 'ActionProcessingJob',
          endedAt: null,
          url: originUrl,
        });
      });
    });

    describe('when given a downstream job without originUrl', () => {
      const job = {
        id: 'hp-1',
        _attempts: 0,
        constructor: { name: 'HtmlParseJob' },
        arguments: { assetCount: 3 },
      };

      it('does not include url', () => {
        const result = JobIndexSerializer.serialize(job, { status });
        expect(result.url).toBeUndefined();
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

  describe('endedAt', () => {
    const status = 'finished';
    const endedAtMs = Date.UTC(2026, 0, 2, 3, 4, 5, 6);

    describe('when the job was marked as ended', () => {
      const job = new Job({ id: 'ended-1' });

      beforeEach(() => {
        job.markEnded(endedAtMs);
      });

      it('returns the ISO string', () => {
        expect(JobIndexSerializer.serialize(job, { status }).endedAt).toEqual('2026-01-02T03:04:05.006Z');
      });
    });

    describe('when the job never ended', () => {
      it('returns null', () => {
        expect(JobIndexSerializer.serialize(new Job({ id: 'n-1' }), { status }).endedAt).toBeNull();
      });
    });

    describe('when the job ended and was cleared for retry', () => {
      const job = new Job({ id: 'cleared-1' });

      beforeEach(() => {
        job.markEnded(endedAtMs);
        job.clearEnded();
      });

      it('returns null', () => {
        expect(JobIndexSerializer.serialize(job, { status }).endedAt).toBeNull();
      });
    });

    describe('when endedAt is undefined', () => {
      const job = { id: 'u-1', _attempts: 0, constructor: { name: 'JobA' }, endedAt: undefined };

      it('returns null', () => {
        expect(JobIndexSerializer.serialize(job, { status }).endedAt).toBeNull();
      });
    });
  });
});
