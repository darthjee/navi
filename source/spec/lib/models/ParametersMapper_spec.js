import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { ParametersMapper } from '../../../lib/models/ParametersMapper.js';

describe('ParametersMapper', () => {
  describe('#map', () => {
    describe('when parameters map is empty', () => {
      it('returns the item unchanged', () => {
        const item = { id: 1, name: 'Electronics' };
        const mapper = new ParametersMapper({});
        expect(mapper.map(item)).toBe(item);
      });
    });

    describe('when no parameters map is provided', () => {
      it('returns the item unchanged', () => {
        const item = { id: 1, name: 'Electronics' };
        const mapper = new ParametersMapper();
        expect(mapper.map(item)).toBe(item);
      });
    });

    describe('when parameters map has dot-notation entries', () => {
      const wrapper = {
        parsed_body: { id: 1, name: 'Electronics', kind_id: 42 },
        headers: { page: '3' },
      };

      it('resolves a single path expression', () => {
        const mapper = new ParametersMapper({ category_id: 'parsed_body.id' });
        expect(mapper.map(wrapper)).toEqual({ category_id: 1 });
      });

      it('supports multiple mappings', () => {
        const mapper = new ParametersMapper({
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
        const mapper = new ParametersMapper({ page: "headers['page']" });
        expect(mapper.map(wrapper)).toEqual({ page: '3' });
      });

      it('resolves header values with double quotes', () => {
        const mapper = new ParametersMapper({ total: 'headers["x-total"]' });
        expect(mapper.map(wrapper)).toEqual({ total: '100' });
      });
    });

    describe('when mixing body and header mappings', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: { page: '3' },
      };

      it('resolves both body and header expressions', () => {
        const mapper = new ParametersMapper({
          id: 'parsed_body.id',
          page: "headers['page']",
        });
        expect(mapper.map(wrapper)).toEqual({ id: 1, page: '3' });
      });
    });

    describe('when parameters map uses parameters namespace', () => {
      const wrapper = {
        parsed_body: { id: 5 },
        headers: {},
        parameters: { category_id: 3 },
      };

      it('resolves a parameters path expression', () => {
        const mapper = new ParametersMapper({ category_id: 'parameters.category_id' });
        expect(mapper.map(wrapper)).toEqual({ category_id: 3 });
      });

      it('supports mixing parameters and parsed_body expressions', () => {
        const mapper = new ParametersMapper({
          id: 'parsed_body.id',
          category_id: 'parameters.category_id',
        });
        expect(mapper.map(wrapper)).toEqual({ id: 5, category_id: 3 });
      });
    });

    describe('when a path expression cannot be resolved', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: {},
      };

      it('throws MissingMappingVariable for a missing body field', () => {
        const mapper = new ParametersMapper({ dest: 'parsed_body.missing_field' });
        expect(() => mapper.map(wrapper)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.missing_field'
        );
      });

      it('throws MissingMappingVariable for a missing header', () => {
        const mapper = new ParametersMapper({ dest: "headers['missing']" });
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
        const mapper = new ParametersMapper({ city: 'parsed_body.user.address.city' });
        expect(mapper.map(wrapper)).toEqual({ city: 'Paris' });
      });
    });
  });
});
