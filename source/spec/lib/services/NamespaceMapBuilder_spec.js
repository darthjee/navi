import { MissingClientsConfig } from '../../../lib/exceptions/config/MissingClientsConfig.js';
import { MissingResourceConfig } from '../../../lib/exceptions/config/MissingResourceConfig.js';
import { NamespaceNotFound } from '../../../lib/exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../../../lib/exceptions/registry/ResourceNotFound.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMapBuilder } from '../../../lib/services/NamespaceMapBuilder.js';
import { ResourceFactory } from '../../support/factories/ResourceFactory.js';

const resourceEntry = (name, requests) => ({ namespace: 'default', resources: { [name]: requests }, clients: {}, filePath: `${name}.yml` });

describe('NamespaceMapBuilder', () => {
  describe('.build', () => {
    describe('with a single file (strict mode)', () => {
      it('builds a Namespace per distinct namespace name', () => {
        const files = [
          {
            namespace: 'default',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
            clients: { default: { base_url: 'https://example.com' } },
            filePath: 'config.yml',
          },
        ];

        const namespaces = NamespaceMapBuilder.build(files);

        expect(Object.keys(namespaces)).toEqual(['default']);
        expect(namespaces.default).toBeInstanceOf(Namespace);
        expect(namespaces.default.resourceRegistry.getItem('categories')).toBeDefined();
        expect(namespaces.default.clientRegistry.getClient('default')).toBeDefined();
      });

      it('throws MissingResourceConfig when the single file omits resources', () => {
        const files = [
          { namespace: 'default', resources: undefined, clients: { default: { base_url: 'https://example.com' } }, filePath: 'config.yml' },
        ];

        expect(() => NamespaceMapBuilder.build(files)).toThrowError(MissingResourceConfig);
      });

      it('throws MissingClientsConfig when the single file omits clients', () => {
        const files = [
          { namespace: 'default', resources: { categories: [{ url: '/categories.json', status: 200 }] }, clients: undefined, filePath: 'config.yml' },
        ];

        expect(() => NamespaceMapBuilder.build(files)).toThrowError(MissingClientsConfig);
      });
    });

    describe('with multiple files (relaxed mode)', () => {
      it('merges files sharing the same namespace', () => {
        const files = [
          {
            namespace: 'default',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
            clients: { default: { base_url: 'https://example.com' } },
            filePath: 'config.yml',
          },
          {
            namespace: 'default',
            resources: { products: [{ url: '/products.json', status: 200 }] },
            clients: {},
            filePath: 'other.yml',
          },
        ];

        const namespaces = NamespaceMapBuilder.build(files);

        expect(namespaces.default.resourceRegistry.getItem('categories')).toBeDefined();
        expect(namespaces.default.resourceRegistry.getItem('products')).toBeDefined();
      });

      it('does not raise when a non-entry file omits resources or clients', () => {
        const files = [
          {
            namespace: 'default',
            resources: { categories: [{ url: '/categories.json', status: 200 }] },
            clients: {},
            filePath: 'config.yml',
          },
          {
            namespace: 'clients',
            resources: {},
            clients: { special: { base_url: 'https://special.example.com' } },
            filePath: 'clients.yml',
          },
        ];

        expect(() => NamespaceMapBuilder.build(files)).not.toThrow();
      });

      it('replaces on collision when two files declare the same resource name in one namespace, the later file winning', () => {
        const files = [
          resourceEntry('categories', [{ url: '/categories.json', status: 200 }]),
          resourceEntry('categories', [{ url: '/other-categories.json', status: 200 }]),
        ];

        const namespaces = NamespaceMapBuilder.build(files);

        const [request] = namespaces.default.resourceRegistry.getItem('categories').resourceRequests;
        expect(request.url).toBe('/other-categories.json');
      });

      it('raises NamespaceNotFound when an action references a namespace that does not exist', () => {
        const files = [
          {
            namespace: 'default',
            resources: {
              categories: [{
                url: '/categories.json',
                status: 200,
                actions: [{ resource: 'missing', namespace: 'unknown' }],
              }],
            },
            clients: {},
            filePath: 'config.yml',
          },
        ];

        expect(() => NamespaceMapBuilder.build(files)).toThrowError(NamespaceNotFound);
      });

      it('raises ResourceNotFound when an action references a resource that does not exist anywhere', () => {
        const files = [
          {
            namespace: 'default',
            resources: {
              categories: [{
                url: '/categories.json',
                status: 200,
                actions: [{ resource: 'missing' }],
              }],
            },
            clients: {},
            filePath: 'config.yml',
          },
        ];

        expect(() => NamespaceMapBuilder.build(files)).toThrowError(ResourceNotFound);
      });

      it('validates paginated_action targets eagerly as well', () => {
        const files = [
          {
            namespace: 'default',
            resources: {
              categories: [{
                url: '/categories.json',
                status: 200,
                paginated_actions: [{
                  resource: 'missing',
                  namespace: 'unknown',
                  pagination: [{ pages: 'parsedBody.pages', page_key: 'page' }],
                }],
              }],
            },
            clients: {},
            filePath: 'config.yml',
          },
        ];

        expect(() => NamespaceMapBuilder.build(files)).toThrowError(NamespaceNotFound);
      });
    });

    describe('merging into an already-existing namespaces map', () => {
      it('creates a brand-new namespace without touching existing ones', () => {
        const existingResource = ResourceFactory.build({ name: 'existing' });
        const existing = {
          default: new Namespace({ name: 'default', resources: { existing: existingResource } }),
        };
        const files = [
          { namespace: 'other', resources: { special: [{ url: '/special.json', status: 200 }] }, clients: {}, filePath: 'other.yml' },
        ];

        const namespaces = NamespaceMapBuilder.build(files, existing);

        expect(namespaces.default.resourceRegistry.getItem('existing')).toBe(existingResource);
        expect(namespaces.other.resourceRegistry.getItem('special')).toBeDefined();
      });

      it('extends an already-existing namespace with a new resource', () => {
        const existingResource = ResourceFactory.build({ name: 'existing' });
        const existing = {
          default: new Namespace({ name: 'default', resources: { existing: existingResource } }),
        };
        const files = [resourceEntry('categories', [{ url: '/categories.json', status: 200 }])];

        const namespaces = NamespaceMapBuilder.build(files, existing);

        expect(namespaces.default.resourceRegistry.getItem('existing')).toBe(existingResource);
        expect(namespaces.default.resourceRegistry.getItem('categories')).toBeDefined();
      });

      it('replaces an already-registered resource on name collision', () => {
        const oldResource = ResourceFactory.build({ name: 'categories' });
        const existing = {
          default: new Namespace({ name: 'default', resources: { categories: oldResource } }),
        };
        const files = [resourceEntry('categories', [{ url: '/new-categories.json', status: 200 }])];

        const namespaces = NamespaceMapBuilder.build(files, existing);

        const resource = namespaces.default.resourceRegistry.getItem('categories');
        expect(resource).not.toBe(oldResource);
        expect(resource.resourceRequests[0].url).toBe('/new-categories.json');
      });

      it('replaces an already-registered client on name collision', () => {
        const oldClient = { name: 'default', baseUrl: 'https://old.example.com' };
        const existing = {
          default: new Namespace({ name: 'default', clients: { default: oldClient } }),
        };
        const files = [
          { namespace: 'default', resources: {}, clients: { default: { base_url: 'https://new.example.com' } }, filePath: 'clients.yml' },
        ];

        const namespaces = NamespaceMapBuilder.build(files, existing);

        const client = namespaces.default.clientRegistry.getClient('default');
        expect(client).not.toBe(oldClient);
        expect(client.baseUrl).toBe('https://new.example.com');
      });

      it('raises when an added resource references something unresolvable against the merged map', () => {
        const existing = {
          default: new Namespace({ name: 'default' }),
        };
        const files = [
          {
            namespace: 'default',
            resources: {
              categories: [{
                url: '/categories.json',
                status: 200,
                actions: [{ resource: 'missing' }],
              }],
            },
            clients: {},
            filePath: 'config.yml',
          },
        ];

        expect(() => NamespaceMapBuilder.build(files, existing)).toThrowError(ResourceNotFound);
      });
    });
  });
});
