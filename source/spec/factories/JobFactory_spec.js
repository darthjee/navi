import { JobFactory } from '../../lib/factories/JobFactory.js';
import { Job } from '../../lib/models/Job.js';
import { ResourceRequest } from '../../lib/models/ResourceRequest.js';

describe('Factory', () => {
  describe('#build', () => {
    let factory;
    let resourceRequest;
    let parameters;

    beforeEach(() => {
      factory = new JobFactory();
      resourceRequest = new ResourceRequest({ url: '/test', status: 200 });
      parameters = {};
    });

    it('builds an instance of Job', () => {
      const job = factory.build({ resourceRequest, parameters });
      expect(job).toBeInstanceOf(Job);
    });
  });
});