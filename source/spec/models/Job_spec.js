import { Job } from '../../lib/models/Job.js';

describe('Job', () => {
  describe('#constructor', () => {
    it('stores the id', () => {
      const job = new Job({ id: 'id' });

      expect(job.id).toEqual('id');
    });
  });
});
