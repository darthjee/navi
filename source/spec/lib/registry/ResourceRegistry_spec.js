import { ResourceNotFound } from '../../../lib/exceptions/ResourceNotFound.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';

describe('ResourceRegistry', () => {
  afterEach(() => {
    ResourceRegistry.reset();
  });

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
  });

  describe('.build', () => {
    it('creates and returns a ResourceRegistry instance', () => {
      const instance = ResourceRegistry.build({ a: 1 });
      expect(instance).toBeInstanceOf(ResourceRegistry);
    });

    it('throws if called twice without reset', () => {
      ResourceRegistry.build({});
      expect(() => ResourceRegistry.build({})).toThrowError(
        'ResourceRegistry.build() has already been called. Call reset() first.'
      );
    });

    it('allows build after reset', () => {
      ResourceRegistry.build({});
      ResourceRegistry.reset();
      expect(() => ResourceRegistry.build({})).not.toThrow();
    });
  });

  describe('.reset', () => {
    it('clears the singleton instance', () => {
      ResourceRegistry.build({ x: 10 });
      ResourceRegistry.reset();
      expect(() => ResourceRegistry.getItem('x')).toThrowError(
        'ResourceRegistry has not been built. Call ResourceRegistry.build() first.'
      );
    });
  });

  describe('.getItem', () => {
    it('delegates to the singleton instance', () => {
      ResourceRegistry.build({ cats: { url: '/cats' } });
      expect(ResourceRegistry.getItem('cats')).toEqual({ url: '/cats' });
    });

    it('throws ResourceNotFound for a missing resource', () => {
      ResourceRegistry.build({});
      expect(() => ResourceRegistry.getItem('missing')).toThrowError(ResourceNotFound);
    });

    it('throws if build has not been called', () => {
      expect(() => ResourceRegistry.getItem('x')).toThrowError(
        'ResourceRegistry has not been built. Call ResourceRegistry.build() first.'
      );
    });
  });

  describe('.filter', () => {
    it('delegates to the singleton instance', () => {
      ResourceRegistry.build({ a: 1, b: 2, c: 3 });
      const result = ResourceRegistry.filter((v) => v > 1);
      expect(result).toEqual([2, 3]);
    });

    it('throws if build has not been called', () => {
      expect(() => ResourceRegistry.filter(() => true)).toThrowError(
        'ResourceRegistry has not been built. Call ResourceRegistry.build() first.'
      );
    });
  });

  describe('.size', () => {
    it('delegates to the singleton instance', () => {
      ResourceRegistry.build({ a: 1, b: 2 });
      expect(ResourceRegistry.size()).toBe(2);
    });

    it('throws if build has not been called', () => {
      expect(() => ResourceRegistry.size()).toThrowError(
        'ResourceRegistry has not been built. Call ResourceRegistry.build() first.'
      );
    });
  });
});