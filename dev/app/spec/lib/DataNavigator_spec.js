import DataNavigator from '../../lib/DataNavigator.js';
import { testData as data } from '../support/fixtures/testData.js';

describe('DataNavigator', () => {
  describe('#navigate', () => {
    const cases = [
      { label: "with ['categories'] returns the property value", steps: ['categories'], expected: () => data.categories },
      { label: "with ['unknown'] returns null for an unknown key", steps: ['unknown'], expected: () => null },
      { label: "with ['categories', 1] finds the element by id", steps: ['categories', 1], expected: () => data.categories[0] },
      { label: "with ['categories', 999] returns null when no element matches", steps: ['categories', 999], expected: () => null },
      { label: "with ['categories', 1, 'items'] traverses nested string keys", steps: ['categories', 1, 'items'], expected: () => data.categories[0].items },
      { label: "with ['categories', 1, 'items', 1] finds a nested element by id", steps: ['categories', 1, 'items', 1], expected: () => data.categories[0].items[0] },
      { label: "with ['categories', 999, 'items'] returns null on intermediate fail", steps: ['categories', 999, 'items'], expected: () => null },
      { label: "with ['categories', 1, 'items', 999] returns null on final fail", steps: ['categories', 1, 'items', 999], expected: () => null },
    ];

    cases.forEach(({ label, steps, expected }) => {
      it(label, () => {
        expect(new DataNavigator(data, steps).navigate()).toEqual(expected());
      });
    });

    describe('with a custom idField', () => {
      const customData = { items: [{ key: 1, name: 'one' }, { key: 2, name: 'two' }] };

      it('finds the element by the custom field', () => {
        const navigator = new DataNavigator(customData, ['items', 1], 'key');
        expect(navigator.navigate()).toBe(customData.items[0]);
      });

      it('returns null when no element matches', () => {
        const navigator = new DataNavigator(customData, ['items', 999], 'key');
        expect(navigator.navigate()).toBeNull();
      });
    });
  });
});
