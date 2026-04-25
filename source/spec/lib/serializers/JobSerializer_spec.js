import { JobSerializer } from '../../../lib/serializers/JobSerializer.js';

describe('JobSerializer', () => {
  const job = { id: 'abc-1', _attempts: 2 };
  const status = 'enqueued';

  describe('.serialize', () => {
    describe('when given a single job object', () => {
      it('returns a plain serialized object', () => {
        expect(JobSerializer.serialize(job, { status })).toEqual({
          id: 'abc-1',
          status: 'enqueued',
          attempts: 2,
        });
      });
    });

    describe('when given an array of job objects', () => {
      const jobA = { id: 'a1', _attempts: 0 };
      const jobB = { id: 'b2', _attempts: 1 };

      it('returns an array of serialized objects', () => {
        expect(JobSerializer.serialize([jobA, jobB], { status: 'processing' })).toEqual([
          { id: 'a1', status: 'processing', attempts: 0 },
          { id: 'b2', status: 'processing', attempts: 1 },
        ]);
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(JobSerializer.serialize([], { status })).toEqual([]);
      });
    });
  });
});
