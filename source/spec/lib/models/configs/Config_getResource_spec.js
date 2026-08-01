import { Config } from '../../../../lib/models/configs/Config.js';
import { ClientRegistry } from '../../../../lib/registry/ClientRegistry.js';
import { Namespace } from '../../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';
import { ResourceRegistry } from '../../../../lib/registry/ResourceRegistry.js';
import { ResourceFactory } from '../../../support/factories/ResourceFactory.js';

describe('Config', () => {
  afterEach(() => {
    ClientRegistry.reset();
    ResourceRegistry.reset();
    NamespaceMap.reset();
  });

  describe('#getResource', () => {
    let config;
    let resource;

    describe('when no explicit namespace is given', () => {
      beforeEach(() => {
        resource = ResourceFactory.build();
        config = new Config({
          namespaceMap: {
            default: new Namespace({ name: 'default', resources: { categories: resource } }),
          },
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

    describe('when an explicit namespace is given', () => {
      beforeEach(() => {
        resource = ResourceFactory.build({ namespace: 'paginated' });
        config = new Config({
          namespaceMap: {
            default: new Namespace({ name: 'default' }),
            paginated: new Namespace({ name: 'paginated', resources: { categories: resource } }),
          },
        });
      });

      it('resolves the resource from that namespace', () => {
        expect(config.getResource('categories', 'paginated')).toBe(resource);
      });
    });
  });
});
