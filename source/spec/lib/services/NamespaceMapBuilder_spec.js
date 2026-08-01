import { MissingClientsConfig } from '../../../lib/exceptions/config/MissingClientsConfig.js';
import { MissingResourceConfig } from '../../../lib/exceptions/config/MissingResourceConfig.js';
import { DuplicateNamespaceItem } from '../../../lib/exceptions/registry/DuplicateNamespaceItem.js';
import { NamespaceNotFound } from '../../../lib/exceptions/registry/NamespaceNotFound.js';
import { ResourceNotFound } from '../../../lib/exceptions/registry/ResourceNotFound.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMapBuilder } from '../../../lib/services/NamespaceMapBuilder.js';

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

      it('raises DuplicateNamespaceItem when two files declare the same resource name in one namespace', () => {
        const files = [
          resourceEntry('categories', [{ url: '/categories.json', status: 200 }]),
          resourceEntry('categories', [{ url: '/other-categories.json', status: 200 }]),
        ];

        expect(() => NamespaceMapBuilder.build(files)).toThrowError(DuplicateNamespaceItem);
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
  });
});
