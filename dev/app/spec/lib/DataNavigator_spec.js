import DataNavigator from '../../lib/DataNavigator.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

describe('DataNavigator', () => {
  describe('#navigate', () => {
    describe('with a single string step', () => {
      it('returns the property value', () => {
        const navigator = new DataNavigator(data, ['categories']);
        expect(navigator.navigate()).toBe(data.categories);
      });

      it('returns null for an unknown key', () => {
        const navigator = new DataNavigator(data, ['unknown']);
        expect(navigator.navigate()).toBeNull();
      });
    });

    describe('with a single integer step', () => {
      it('finds the element by id', () => {
        const navigator = new DataNavigator(data, ['categories', 1]);
        expect(navigator.navigate()).toBe(data.categories[0]);
      });

      it('returns null when no element matches the id', () => {
        const navigator = new DataNavigator(data, ['categories', 999]);
        expect(navigator.navigate()).toBeNull();
      });
    });

    describe('with chained steps', () => {
      it('traverses nested string keys', () => {
        const navigator = new DataNavigator(data, ['categories', 1, 'items']);
        expect(navigator.navigate()).toBe(data.categories[0].items);
      });

      it('finds a nested element by id', () => {
        const navigator = new DataNavigator(data, ['categories', 1, 'items', 1]);
        expect(navigator.navigate()).toBe(data.categories[0].items[0]);
      });

      it('returns null when an intermediate integer step fails', () => {
        const navigator = new DataNavigator(data, ['categories', 999, 'items']);
        expect(navigator.navigate()).toBeNull();
      });

      it('returns null when a final integer step fails', () => {
        const navigator = new DataNavigator(data, ['categories', 1, 'items', 999]);
        expect(navigator.navigate()).toBeNull();
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
