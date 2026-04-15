import Serializer from '../../lib/Serializer.js';

describe('Serializer', () => {
  const serializer = new Serializer(['id', 'name']);

  describe('#serialize', () => {
    describe('with a single object', () => {
      it('returns only the specified attributes', () => {
        const result = serializer.serialize({ id: 1, name: 'Books', extra: 'ignored' });
        expect(result).toEqual({ id: 1, name: 'Books' });
      });
    });

    describe('with an array', () => {
      it('maps each element returning only the specified attributes', () => {
        const result = serializer.serialize([
          { id: 1, name: 'Books', extra: 'ignored' },
          { id: 2, name: 'Movies', extra: 'also ignored' },
        ]);
        expect(result).toEqual([
          { id: 1, name: 'Books' },
          { id: 2, name: 'Movies' },
        ]);
      });
    });

    describe('when a configured attribute is missing from the object', () => {
      it('throws an error identifying the missing attribute', () => {
        expect(() => serializer.serialize({ id: 1 }))
          .toThrowError('Serializer: attribute "name" is not present in the data');
      });
    });

    describe('when a configured attribute is missing from an array item', () => {
      it('throws an error for the item with the missing attribute', () => {
        expect(() => serializer.serialize([{ id: 1, name: 'Books' }, { id: 2 }]))
          .toThrowError('Serializer: attribute "name" is not present in the data');
      });
    });
  });
});
