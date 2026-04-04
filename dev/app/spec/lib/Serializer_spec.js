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
  });
});
