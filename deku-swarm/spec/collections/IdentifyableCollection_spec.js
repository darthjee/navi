/**
 * Unit tests for IdentifyableCollection.
 * Uses Jasmine.
 */
import { IdentifyableCollection } from '../../lib/collections/IdentifyableCollection.js';

describe('IdentifyableCollection', () => {
  let collection;

  beforeEach(() => {
    collection = new IdentifyableCollection();
  });

  it('pushes and retrieves an item by id', () => {
    const item = { id: 'a', value: 1 };
    collection.push(item);

    expect(collection.get('a')).toBe(item);
    expect(collection.size()).toEqual(1);
    expect(collection.hasAny()).toBeTrue();
    expect(collection.list()).toEqual([item]);
  });

  it('removes an item by id', () => {
    const item = { id: 'remove_me' };
    collection.push(item);

    expect(collection.get('remove_me')).toBe(item);

    collection.remove('remove_me');

    expect(collection.get('remove_me')).toBeUndefined();
    expect(collection.size()).toEqual(0);
    expect(collection.hasAny()).toBeFalse();
  });

  it('supports lookup by index (preserves insertion order)', () => {
    const first = { id: 'one' };
    const second = { id: 'two' };
    collection.push(first);
    collection.push(second);

    expect(collection.byIndex(0)).toBe(first);
    expect(collection.byIndex(1)).toBe(second);
    expect(collection.list().map(i => i.id)).toEqual(['one', 'two']);
  });

  it('finds an item by id', () => {
    const item = { id: 'find_me', value: 42 };
    collection.push(item);

    expect(collection.findById('find_me')).toBe(item);
  });

  it('returns null when findById does not find a match', () => {
    expect(collection.findById('missing')).toBeNull();
  });

  it('keeps insertion order for integer-like ids', () => {
    collection.push({ id: 10 });
    collection.push({ id: 2 });

    expect(collection.list().map(i => i.id)).toEqual([10, 2]);
  });

  it('accepts a plain object as initial items', () => {
    const item = { id: 'a' };
    const built = new IdentifyableCollection({ a: item });

    expect(built.get('a')).toBe(item);
    expect(built.size()).toEqual(1);
  });

  it('accepts a Map as initial items', () => {
    const item = { id: 'a' };
    const built = new IdentifyableCollection(new Map([['a', item]]));

    expect(built.get('a')).toBe(item);
    expect(built.has('a')).toBeTrue();
  });
});
