import { JobFactory } from '../../lib/factories/JobFactory.js';
import { Job } from '../../lib/models/Job.js';

describe('Factory', () => {
  describe('#build', () => {
    let factory;
    beforeEach(() => {
      factory = new JobFactory();
    });

    it('builds an instance of Job', () => {
      const job = factory.build();
      expect(job).toBeInstanceOf(Job);
    });
  });
});