import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';

describe('Namespace', () => {
  describe('#constructor', () => {
    it('stores the namespace name', () => {
      const namespace = new Namespace({ name: 'paginated' });
      expect(namespace.name).toBe('paginated');
    });

    it('builds a ResourceRegistry instance from the given resources', () => {
      const resource = ResourceFactory.build();
      const namespace = new Namespace({ name: 'default', resources: { categories: resource } });

      expect(namespace.resourceRegistry).toBeInstanceOf(ResourceRegistry);
      expect(namespace.resourceRegistry.getItem('categories')).toBe(resource);
    });

    it('builds a ClientRegistry instance from the given clients', () => {
      const client = ClientFactory.build();
      const namespace = new Namespace({ name: 'default', clients: { default: client } });

      expect(namespace.clientRegistry).toBeInstanceOf(ClientRegistry);
      expect(namespace.clientRegistry.getClient('default')).toBe(client);
    });

    it('defaults to empty resources and clients', () => {
      const namespace = new Namespace({ name: 'default' });

      expect(namespace.resourceRegistry.size()).toBe(0);
      expect(namespace.clientRegistry.items).toEqual({});
    });
  });
});
