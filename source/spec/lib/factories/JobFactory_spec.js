import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { ResourceRequestJob } from '../../../lib/models/ResourceRequestJob.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('JobFactory', () => {
  describe('#build', () => {
    let factory;
    let resourceRequest;
    let parameters;
    let clients;

    beforeEach(() => {
      clients = ClientRegistryFactory.build({});
      factory = new JobFactory({ attributes: { clients } });
      resourceRequest = ResourceRequestFactory.build({ url: '/test' });
      parameters = {};
    });

    it('builds an instance of ResourceRequestJob', () => {
      const job = factory.build({ resourceRequest, parameters });
      expect(job).toBeInstanceOf(ResourceRequestJob);
    });
  });
});
