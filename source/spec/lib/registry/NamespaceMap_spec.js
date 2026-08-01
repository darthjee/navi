import { ClientNotFound } from '../../../lib/exceptions/registry/ClientNotFound.js';
import { NamespaceNotFound } from '../../../lib/exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../../../lib/exceptions/registry/ResourceNotFound.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';
import { ClientFactory } from '../../support/factories/ClientFactory.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';

describe('NamespaceMap', () => {
  let defaultResource;
  let paginatedResource;
  let defaultClient;
  let clientsClient;
  let namespaces;

  beforeEach(() => {
    defaultResource = ResourceFactory.build({ name: 'people' });
    paginatedResource = ResourceFactory.build({ name: 'paginated_people', namespace: 'paginated' });
    defaultClient = ClientFactory.build({ name: 'default' });
    clientsClient = ClientFactory.build({ name: 'non-default', namespace: 'clients' });

    namespaces = {
      default: new Namespace({ name: 'default', resources: { people: defaultResource }, clients: { default: defaultClient } }),
      paginated: new Namespace({ name: 'paginated', resources: { paginated_people: paginatedResource } }),
      clients: new Namespace({ name: 'clients', clients: { 'non-default': clientsClient } }),
    };
  });

  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('instance methods', () => {
    describe('#getResource', () => {
      let namespaceMap;

      beforeEach(() => {
        namespaceMap = new NamespaceMap(namespaces);
      });

      it('resolves a resource declared in the origin namespace when no explicit namespace is given', () => {
        expect(namespaceMap.getResource('default', 'people', null)).toBe(defaultResource);
      });

      it('resolves a resource declared in an explicit namespace', () => {
        expect(namespaceMap.getResource('default', 'paginated_people', 'paginated')).toBe(paginatedResource);
      });

      it('falls back to the default namespace when no namespace is given and the origin lookup fails', () => {
        expect(namespaceMap.getResource('paginated', 'people', null)).toBe(defaultResource);
      });

      it('throws ResourceNotFound when the explicit namespace exists but the resource does not', () => {
        expect(() => namespaceMap.getResource('default', 'missing', 'paginated')).toThrowError(ResourceNotFound);
      });

      it('does not fall back to default when an explicit namespace is given and lookup fails', () => {
        namespaces.paginated = new Namespace({ name: 'paginated', resources: {} });
        namespaceMap = new NamespaceMap(namespaces);

        expect(() => namespaceMap.getResource('default', 'people', 'paginated')).toThrowError(ResourceNotFound);
      });

      it('throws NamespaceNotFound when an explicit namespace does not exist', () => {
        expect(() => namespaceMap.getResource('default', 'people', 'unknown')).toThrowError(NamespaceNotFound);
      });

      it('throws ResourceNotFound when no namespace is given and neither origin nor default has the resource', () => {
        expect(() => namespaceMap.getResource('paginated', 'unknown', null)).toThrowError(ResourceNotFound);
      });

      it('throws NamespaceNotFound when no namespace is given, the origin namespace does not exist, and default is missing', () => {
        const map = new NamespaceMap({ paginated: namespaces.paginated });
        expect(() => map.getResource('unknown_origin', 'paginated_people', null)).toThrowError(NamespaceNotFound);
      });
    });

    describe('#getClient', () => {
      let namespaceMap;

      beforeEach(() => {
        namespaceMap = new NamespaceMap(namespaces);
      });

      it('resolves a client declared in the origin namespace when no explicit namespace is given', () => {
        expect(namespaceMap.getClient('default', 'default', null)).toBe(defaultClient);
      });

      it('resolves a client declared in an explicit namespace', () => {
        expect(namespaceMap.getClient('default', 'non-default', 'clients')).toBe(clientsClient);
      });

      it('falls back to the default namespace when no namespace is given and the origin lookup fails', () => {
        expect(namespaceMap.getClient('paginated', 'default', null)).toBe(defaultClient);
      });

      it('throws ClientNotFound when the explicit namespace exists but the client does not', () => {
        expect(() => namespaceMap.getClient('default', 'missing', 'clients')).toThrowError(ClientNotFound);
      });

      it('does not fall back to default when an explicit namespace is given and lookup fails', () => {
        namespaces.clients = new Namespace({ name: 'clients', clients: {} });
        namespaceMap = new NamespaceMap(namespaces);

        expect(() => namespaceMap.getClient('default', 'default', 'clients')).toThrowError(ClientNotFound);
      });

      it('throws NamespaceNotFound when an explicit namespace does not exist', () => {
        expect(() => namespaceMap.getClient('default', 'default', 'unknown')).toThrowError(NamespaceNotFound);
      });

      it('honors default-client convenience within the resolved namespace', () => {
        expect(namespaceMap.getClient('clients', 'default', null)).toBe(clientsClient);
      });
    });
  });

  describe('.build', () => {
    it('creates and returns a NamespaceMap instance', () => {
      const instance = NamespaceMap.build(namespaces);
      expect(instance).toBeInstanceOf(NamespaceMap);
    });

    it('throws if called twice without reset', () => {
      NamespaceMap.build(namespaces);
      expect(() => NamespaceMap.build(namespaces)).toThrowError(
        'NamespaceMap.build() has already been called. Call reset() first.'
      );
    });

    it('allows build after reset', () => {
      NamespaceMap.build(namespaces);
      NamespaceMap.reset();
      expect(() => NamespaceMap.build(namespaces)).not.toThrow();
    });
  });

  describe('.reset', () => {
    it('clears the singleton instance', () => {
      NamespaceMap.build(namespaces);
      NamespaceMap.reset();
      expect(() => NamespaceMap.getResource('default', 'people')).toThrowError(
        'NamespaceMap has not been built. Call NamespaceMap.build() first.'
      );
    });
  });

  describe('.getResource', () => {
    it('delegates to the singleton instance', () => {
      NamespaceMap.build(namespaces);
      expect(NamespaceMap.getResource('default', 'people')).toBe(defaultResource);
    });
  });

  describe('.getClient', () => {
    it('delegates to the singleton instance', () => {
      NamespaceMap.build(namespaces);
      expect(NamespaceMap.getClient('default', 'default')).toBe(defaultClient);
    });
  });
});
