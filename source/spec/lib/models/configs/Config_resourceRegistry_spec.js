import { Config } from '../../../../lib/models/configs/Config.js';
import { Namespace } from '../../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';
import { ResourceRegistry } from '../../../../lib/registry/ResourceRegistry.js';
import { ResourceFactory } from '../../../support/factories/ResourceFactory.js';

describe('Config', () => {
  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('#resourceRegistry', () => {
    let config;
    let resource;

    describe('when there is a default namespace', () => {
      beforeEach(() => {
        resource = ResourceFactory.build();
        config = new Config({
          namespaceMap: {
            default: new Namespace({ name: 'default', resources: { categories: resource } }),
          },
        });
      });

      it('returns the current default namespace resourceRegistry', () => {
        expect(config.resourceRegistry).toBe(config.namespaceMap.getItem('default').resourceRegistry);
        expect(config.resourceRegistry.getItem('categories')).toBe(resource);
      });

      describe('when a resource is added to the default namespace after construction', () => {
        beforeEach(() => {
          NamespaceMap.include([
            {
              namespace: 'default',
              resources: { widgets: [{ url: '/widgets.json', status: 200 }] },
              clients: {},
              filePath: 'extra.yml',
            },
          ]);
        });

        it('reflects the newly added resource', () => {
          expect(config.resourceRegistry.getItem('widgets')).toBeDefined();
          expect(config.resourceRegistry.getItem('categories')).toBe(resource);
        });
      });
    });

    describe('when there is no default namespace', () => {
      beforeEach(() => {
        config = new Config({
          namespaceMap: {
            paginated: new Namespace({ name: 'paginated' }),
          },
        });
      });

      it('falls back to an empty ResourceRegistry', () => {
        expect(config.resourceRegistry instanceof ResourceRegistry).toBeTrue();
        expect(config.resourceRegistry.items).toEqual({});
      });
    });
  });
});
