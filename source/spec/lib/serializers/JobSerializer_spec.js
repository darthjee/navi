import { JobSerializer } from '../../../lib/serializers/JobSerializer.js';

describe('JobSerializer', () => {
  const status = 'enqueued';

  describe('.serialize', () => {
    describe('when view is "index" (default)', () => {
      const job = {
        id: 'abc-1',
        _attempts: 2,
        constructor: { name: 'ResourceRequestJob' },
        arguments: { url: '/items.json' },
      };

      it('delegates to JobIndexSerializer for a single job', () => {
        expect(JobSerializer.serialize(job, { status })).toEqual({
          id: 'abc-1',
          status: 'enqueued',
          attempts: 2,
          jobClass: 'ResourceRequestJob',
          endedAt: null,
          url: '/items.json',
        });
      });

      it('delegates to JobIndexSerializer for an array of jobs', () => {
        const jobA = { id: 'a1', _attempts: 0, constructor: { name: 'JobA' } };
        const jobB = { id: 'b2', _attempts: 1, constructor: { name: 'JobB' } };

        expect(JobSerializer.serialize([jobA, jobB], { status: 'processing' })).toEqual([
          { id: 'a1', status: 'processing', attempts: 0, jobClass: 'JobA', endedAt: null },
          { id: 'b2', status: 'processing', attempts: 1, jobClass: 'JobB', endedAt: null },
        ]);
      });

      it('carries endedAt through the index view', () => {
        const ended = { id: 'e1', _attempts: 0, constructor: { name: 'JobA' }, endedAt: Date.UTC(2026, 0, 2, 3, 4, 5, 6) };
        expect(JobSerializer.serialize(ended, { status: 'finished' }).endedAt).toEqual('2026-01-02T03:04:05.006Z');
      });

      it('returns an empty array when given an empty array', () => {
        expect(JobSerializer.serialize([], { status })).toEqual([]);
      });
    });

    describe('when view is "index" (explicit)', () => {
      const job = { id: 'xyz', _attempts: 0, constructor: { name: 'AssetDownloadJob' } };

      it('delegates to JobIndexSerializer', () => {
        expect(JobSerializer.serialize(job, { status, view: 'index' })).toEqual({
          id: 'xyz',
          status,
          attempts: 0,
          jobClass: 'AssetDownloadJob',
          endedAt: null,
        });
      });
    });

    describe('when view is "show"', () => {
      const job = {
        id: 'def-2',
        _attempts: 1,
        constructor: { name: 'ActionProcessingJob' },
        arguments: { item: { id: 42 } },
        maxRetries: 1,
        readyBy: 0,
      };

      it('delegates to JobShowSerializer', () => {
        const result = JobSerializer.serialize(job, { status: 'failed', view: 'show' });
        expect(result).toEqual(jasmine.objectContaining({
          id: 'def-2',
          status: 'failed',
          attempts: 1,
          jobClass: 'ActionProcessingJob',
          arguments: { item: { id: 42 } },
          remainingAttempts: 0,
        }));
        expect(result.readyInMs).toBeGreaterThanOrEqual(0);
      });

      it('carries endedAt through the show view', () => {
        const ended = { ...job, endedAt: Date.UTC(2026, 0, 2, 3, 4, 5, 6) };
        expect(JobSerializer.serialize(ended, { status: 'dead', view: 'show' }).endedAt)
          .toEqual('2026-01-02T03:04:05.006Z');
      });
    });
  });
});
