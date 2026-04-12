import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { VariablesMapper } from '../../../lib/models/VariablesMapper.js';

describe('VariablesMapper', () => {
  describe('#map', () => {
    describe('when parameters map is empty', () => {
      it('returns the item unchanged', () => {
        const item = { id: 1, name: 'Electronics' };
        const mapper = new VariablesMapper({});
        expect(mapper.map(item)).toBe(item);
      });
    });

    describe('when no parameters map is provided', () => {
      it('returns the item unchanged', () => {
        const item = { id: 1, name: 'Electronics' };
        const mapper = new VariablesMapper();
        expect(mapper.map(item)).toBe(item);
      });
    });

    describe('when parameters map has dot-notation entries', () => {
      const wrapper = {
        parsed_body: { id: 1, name: 'Electronics', kind_id: 42 },
        headers: { page: '3' },
      };

      it('resolves a single path expression', () => {
        const mapper = new VariablesMapper({ category_id: 'parsed_body.id' });
        expect(mapper.map(wrapper)).toEqual({ category_id: 1 });
      });

      it('supports multiple mappings', () => {
        const mapper = new VariablesMapper({
          category_id: 'parsed_body.id',
          id: 'parsed_body.kind_id',
        });
        expect(mapper.map(wrapper)).toEqual({ category_id: 1, id: 42 });
      });
    });

    describe('when parameters map uses bracket notation for headers', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: { page: '3', 'x-total': '100' },
      };

      it('resolves header values via bracket notation', () => {
        const mapper = new VariablesMapper({ page: "headers['page']" });
        expect(mapper.map(wrapper)).toEqual({ page: '3' });
      });

      it('resolves header values with double quotes', () => {
        const mapper = new VariablesMapper({ total: 'headers["x-total"]' });
        expect(mapper.map(wrapper)).toEqual({ total: '100' });
      });
    });

    describe('when mixing body and header mappings', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: { page: '3' },
      };

      it('resolves both body and header expressions', () => {
        const mapper = new VariablesMapper({
          id: 'parsed_body.id',
          page: "headers['page']",
        });
        expect(mapper.map(wrapper)).toEqual({ id: 1, page: '3' });
      });
    });

    describe('when a path expression cannot be resolved', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: {},
      };

      it('throws MissingMappingVariable for a missing body field', () => {
        const mapper = new VariablesMapper({ dest: 'parsed_body.missing_field' });
        expect(() => mapper.map(wrapper)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.missing_field'
        );
      });

      it('throws MissingMappingVariable for a missing header', () => {
        const mapper = new VariablesMapper({ dest: "headers['missing']" });
        expect(() => mapper.map(wrapper)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === "headers['missing']"
        );
      });
    });

    describe('when resolving nested body paths', () => {
      const wrapper = {
        parsed_body: { user: { address: { city: 'Paris' } } },
        headers: {},
      };

      it('resolves deeply nested dot notation', () => {
        const mapper = new VariablesMapper({ city: 'parsed_body.user.address.city' });
        expect(mapper.map(wrapper)).toEqual({ city: 'Paris' });
      });
    });
  });
});
