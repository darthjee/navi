import { ResourceRegistry } from '../../lib/models/ResourceRegistry.js';
import { ResourceNotFound } from '../../lib/exceptions/ResourceNotFound.js';

describe('ResourceRegistry', () => {
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
});