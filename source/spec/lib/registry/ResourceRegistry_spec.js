import { ResourceNotFound } from '../../../lib/exceptions/registry/ResourceNotFound.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';

describe('ResourceRegistry', () => {
  describe('instance methods', () => {
    it('returns the resource when present', () => {
      const registry = new ResourceRegistry({ categories: { url: '/categories' } });
      expect(registry.getItem('categories')).toEqual({ url: '/categories' });
    });

    it('throws ResourceNotFound when resource is missing', () => {
      const registry = new ResourceRegistry({});
      expect(() => registry.getItem('missing')).toThrowError(ResourceNotFound);
    });

    it('honors subclass static notFoundException override', () => {
      class CustomNotFound extends Error {
        constructor(name) {
          super(`Custom not found: ${name}`);
          this.name = 'CustomNotFound';
        }
      }

      class CustomResourceRegistry extends ResourceRegistry {
        static notFoundException = CustomNotFound;
      }

      const registry = new CustomResourceRegistry({});
      expect(() => registry.getItem('x')).toThrowError(CustomNotFound);
    });

    it('reports whether a resource is present via has', () => {
      const registry = new ResourceRegistry({ categories: { url: '/categories' } });
      expect(registry.has('categories')).toBe(true);
      expect(registry.has('missing')).toBe(false);
    });
  });
});
