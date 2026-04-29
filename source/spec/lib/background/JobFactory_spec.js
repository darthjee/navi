import { JobFactory } from '../../../lib/background/JobFactory.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ClientRegistryFactory } from '../../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('JobFactory', () => {
  afterEach(() => {
    JobFactory.reset();
  });

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

  describe('.build', () => {
    it('creates and registers a factory under the given name', () => {
      const clients = ClientRegistryFactory.build({});
      const factory = JobFactory.build('MyFactory', { attributes: { clients } });

      expect(factory).toBeInstanceOf(JobFactory);
      expect(JobFactory.get('MyFactory')).toBe(factory);
    });
  });

  describe('.registry / .get / .reset', () => {
    let factory;

    beforeEach(() => {
      factory = new JobFactory({ attributes: { clients: ClientRegistryFactory.build({}) } });
    });

    describe('.registry and .get', () => {
      it('registers and retrieves a factory by name', () => {
        JobFactory.registry('MyFactory', factory);
        expect(JobFactory.get('MyFactory')).toBe(factory);
      });

      it('returns undefined for an unregistered name', () => {
        expect(JobFactory.get('Unknown')).toBeUndefined();
      });
    });

    describe('.reset', () => {
      it('clears all registered factories', () => {
        JobFactory.registry('MyFactory', factory);
        JobFactory.reset();
        expect(JobFactory.get('MyFactory')).toBeUndefined();
      });
    });
  });
});
