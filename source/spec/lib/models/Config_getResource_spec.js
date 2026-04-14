import { Config } from '../../../lib/models/Config.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';

describe('Config', () => {
  afterEach(() => {
    ResourceRegistry.reset();
  });

  describe('#getResource', () => {
    let config;
    let resource;

    beforeEach(() => {
      resource = ResourceFactory.build();
      config = new Config({
        resources: { categories: resource },
        clients: {},
      });
    });

    describe('when the resource exists', () => {
      it('returns the resource', () => {
        expect(config.getResource('categories')).toBe(resource);
      });
    });

    describe('when the resource does not exist', () => {
      it('throws an error', () => {
        expect(() => config.getResource('unknown')).toThrowError('Resource "unknown" not found.');
      });
    });
  });
});
