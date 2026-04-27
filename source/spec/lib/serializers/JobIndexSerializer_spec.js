import { JobIndexSerializer } from '../../../lib/serializers/JobIndexSerializer.js';

describe('JobIndexSerializer', () => {
  const status = 'enqueued';

  describe('.serialize', () => {
    describe('when given a single job object', () => {
      const job = { id: 'abc-1', _attempts: 2, constructor: { name: 'ResourceRequestJob' } };

      it('returns a plain serialized object with id, status, attempts, and jobClass', () => {
        expect(JobIndexSerializer.serialize(job, { status })).toEqual({
          id: 'abc-1',
          status: 'enqueued',
          attempts: 2,
          jobClass: 'ResourceRequestJob',
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
});
