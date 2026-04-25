import { Serializer } from '../../../lib/serializers/Serializer.js';

describe('Serializer', () => {
  class ConcreteSerializer extends Serializer {
    static _serializeObject(item, { label }) {
      return { value: item.value, label };
    }
  }

  describe('.serialize', () => {
    describe('when given a single object', () => {
      it('delegates to _serializeObject', () => {
        expect(ConcreteSerializer.serialize({ value: 42 }, { label: 'test' })).toEqual({
          value: 42,
          label: 'test',
        });
      });
    });

    describe('when given an array of objects', () => {
      it('returns an array of serialized objects', () => {
        const items = [{ value: 1 }, { value: 2 }];
        expect(ConcreteSerializer.serialize(items, { label: 'x' })).toEqual([
          { value: 1, label: 'x' },
          { value: 2, label: 'x' },
        ]);
      });
    });

    describe('when given an empty array', () => {
      it('returns an empty array', () => {
        expect(ConcreteSerializer.serialize([], { label: 'x' })).toEqual([]);
      });
    });
  });

  describe('._serializeObject', () => {
    it('throws when called directly on the base class', () => {
      expect(() => Serializer._serializeObject({}, {})).toThrowError(
        'Subclasses must implement _serializeObject'
      );
    });
  });
});
