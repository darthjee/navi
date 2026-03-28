import { JobFactory } from '../../lib/factories/JobFactory.js';
import { Job } from '../../lib/models/Job.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';

describe('Factory', () => {
  describe('#build', () => {
    let factory;
    let resourceRequest;
    let parameters;
    let clients;

    beforeEach(() => {
      factory = new JobFactory();
      resourceRequest = ResourceRequestFactory.build({ url: '/test' });
      parameters = {};
      clients = new ClientRegistry({});
    });

    it('builds an instance of Job', () => {
      const job = factory.build({ resourceRequest, parameters, clients });
      expect(job).toBeInstanceOf(Job);
    });
  });
});