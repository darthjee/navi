import { Job } from '../../lib/models/Job.js';

describe('Job', () => {
  describe('#constructor', () => {
    it('stores the payload', () => {
      const payload = { url: '/test' };
      const job = new Job({ payload });

      expect(job.payload).toEqual(payload);
    });
  });
});
