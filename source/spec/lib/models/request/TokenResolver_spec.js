import { TokenResolver } from '../../../../lib/models/request/TokenResolver.js';

describe('TokenResolver', () => {
  describe('.resolve', () => {
    describe('when the path is "."', () => {
      it('resolves to the whole item', () => {
        const item = { id: 1, name: 'Widget' };

        expect(TokenResolver.resolve('.', item)).toBe(item);
      });

      it('resolves to the whole item when the item is a non-object (string)', () => {
        expect(TokenResolver.resolve('.', 'a string item')).toBe('a string item');
      });

      it('resolves to the whole item when the item is a non-object (number)', () => {
        expect(TokenResolver.resolve('.', 42)).toBe(42);
      });
    });

    describe('when the path is a single segment', () => {
      it('resolves a top-level property', () => {
        expect(TokenResolver.resolve('name', { name: 'Widget' })).toEqual('Widget');
      });
    });

    describe('when the path is a multi-segment dot-path', () => {
      it('resolves through nested objects', () => {
        const item = { address: { city: 'Springfield' } };

        expect(TokenResolver.resolve('address.city', item)).toEqual('Springfield');
      });
    });

    describe('when an intermediate segment is missing', () => {
      it('resolves to undefined rather than throwing', () => {
        expect(TokenResolver.resolve('a.b.c', { a: null })).toBeUndefined();
      });
    });

    describe('when the resolved value is falsy but defined', () => {
      it('returns null as-is', () => {
        expect(TokenResolver.resolve('value', { value: null })).toBeNull();
      });

      it('returns 0 as-is', () => {
        expect(TokenResolver.resolve('value', { value: 0 })).toBe(0);
      });

      it('returns false as-is', () => {
        expect(TokenResolver.resolve('value', { value: false })).toBe(false);
      });

      it("returns '' as-is", () => {
        expect(TokenResolver.resolve('value', { value: '' })).toBe('');
      });
    });
  });
});
