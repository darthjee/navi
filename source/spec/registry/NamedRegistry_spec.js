/**
 * Unit tests for NamedRegistry (abstract base behavior).
 * Uses Jasmine.
 */
import { NamedRegistry } from '../../lib/registry/NamedRegistry.js';
import { ItemNotFound } from '../../lib/exceptions/ItemNotFound.js';

describe('NamedRegistry', () => {
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