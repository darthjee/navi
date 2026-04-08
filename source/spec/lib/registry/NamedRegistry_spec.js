/**
 * Unit tests for NamedRegistry (abstract base behavior).
 * Uses Jasmine.
 */
import { ItemNotFound } from '../../../lib/exceptions/ItemNotFound.js';
import { NamedRegistry } from '../../../lib/registry/NamedRegistry.js';

describe('NamedRegistry', () => {
  let registry;

  describe('getItem', () => {
    it('returns the item when present', () => {
      const registry = new NamedRegistry({ foo: 'bar' });
      expect(registry.getItem('foo')).toBe('bar');
    });

    it('throws ItemNotFound when item is missing (default exception)', () => {
      const registry = new NamedRegistry({});
      expect(() => registry.getItem('missing')).toThrowError(ItemNotFound);
    });

    it('respects subclass static notFoundException override', () => {
      class CustomNotFound extends Error {
        constructor(name) {
          super(`Custom not found: ${name}`);
          this.name = 'CustomNotFound';
        }
      }

      class CustomRegistry extends NamedRegistry {
        static notFoundException = CustomNotFound;
      }

      const registry = new CustomRegistry({});
      expect(() => registry.getItem('x')).toThrowError(CustomNotFound);
    });
  });

  describe('#filter', () => {
    const items = {
      foo: { name: 'foo', value: 1 },
      bar: { name: 'bar', value: 2 },
      baz: { name: 'baz', value: 3 }
    };

    beforeEach(() => {
      registry = new NamedRegistry(items);
    });

    it('returns all items matching the predicate', () => {
      const result = registry.filter(item => item.value > 1);
      expect(result).toEqual([
        { name: 'bar', value: 2 },
        { name: 'baz', value: 3 }
      ]);
    });

    it('returns an empty array if no items match', () => {
      const result = registry.filter(item => item.value > 10);
      expect(result).toEqual([]);
    });

    it('returns all items if predicate always returns true', () => {
      const result = registry.filter(() => true);
      expect(result).toEqual(Object.values(items));
    });

    it('returns an empty array if registry is empty', () => {
      const emptyRegistry = new NamedRegistry({});
      const result = emptyRegistry.filter(() => true);
      expect(result).toEqual([]);
    });
  });

  describe('#size', () => {
    const items = {
      foo: { name: 'foo', value: 1 },
      bar: { name: 'bar', value: 2 },
      baz: { name: 'baz', value: 3 }
    };

    beforeEach(() => {
      registry = new NamedRegistry(items);
    });

    it('returns the number of items in the registry', () => {
      expect(registry.size()).toBe(3);
    });

    it('returns 0 when the registry is empty', () => {
      const emptyRegistry = new NamedRegistry({});
      expect(emptyRegistry.size()).toBe(0);
    });
  });
});