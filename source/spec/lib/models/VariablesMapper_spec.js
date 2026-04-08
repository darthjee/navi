import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { VariablesMapper } from '../../../lib/models/VariablesMapper.js';

describe('VariablesMapper', () => {
  describe('#map', () => {
    const item = { id: 1, name: 'Electronics', kind_id: 42 };

    describe('when variables_map is empty', () => {
      it('returns the item unchanged', () => {
        const mapper = new VariablesMapper({});
        expect(mapper.map(item)).toBe(item);
      });
    });

    describe('when no variables_map is provided', () => {
      it('returns the item unchanged', () => {
        const mapper = new VariablesMapper();
        expect(mapper.map(item)).toBe(item);
      });
    });

    describe('when variables_map has entries', () => {
      it('returns only the mapped fields with renamed keys', () => {
        const mapper = new VariablesMapper({ id: 'category_id' });
        expect(mapper.map(item)).toEqual({ category_id: 1 });
      });

      it('supports multiple mappings', () => {
        const mapper = new VariablesMapper({ id: 'category_id', kind_id: 'id' });
        expect(mapper.map(item)).toEqual({ category_id: 1, id: 42 });
      });
    });

    describe('when a source key is missing from the item', () => {
      it('throws MissingMappingVariable with the missing key name', () => {
        const mapper = new VariablesMapper({ missing_field: 'dest' });
        expect(() => mapper.map(item)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable && error.variable === 'missing_field'
        );
      });
    });
  });
});
