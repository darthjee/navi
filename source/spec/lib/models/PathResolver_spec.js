import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { PathResolver } from '../../../lib/models/PathResolver.js';

describe('PathResolver', () => {
  describe('.fromExpression', () => {
    it('returns a PathResolver instance', () => {
      const resolver = PathResolver.fromExpression('parsed_body.id');
      expect(resolver).toBeInstanceOf(PathResolver);
    });
  });

  describe('#resolve', () => {
    describe('when resolving dot-notation paths', () => {
      const wrapper = {
        parsed_body: { id: 1, name: 'Electronics', kind_id: 42 },
        headers: { page: '3' },
      };

      it('resolves a single-level body path', () => {
        const resolver = PathResolver.fromExpression('parsed_body.id');
        expect(resolver.resolve(wrapper)).toBe(1);
      });

      it('resolves a nested body path', () => {
        const resolver = PathResolver.fromExpression('parsed_body.name');
        expect(resolver.resolve(wrapper)).toBe('Electronics');
      });
    });

    describe('when resolving bracket-notation paths', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: { page: '3', 'x-total': '100' },
      };

      it('resolves header values via single-quote bracket notation', () => {
        const resolver = PathResolver.fromExpression("headers['page']");
        expect(resolver.resolve(wrapper)).toBe('3');
      });

      it('resolves header values via double-quote bracket notation', () => {
        const resolver = PathResolver.fromExpression('headers["x-total"]');
        expect(resolver.resolve(wrapper)).toBe('100');
      });
    });

    describe('when resolving deeply nested paths', () => {
      const wrapper = {
        parsed_body: { user: { address: { city: 'Paris' } } },
        headers: {},
      };

      it('resolves deeply nested dot notation', () => {
        const resolver = PathResolver.fromExpression('parsed_body.user.address.city');
        expect(resolver.resolve(wrapper)).toBe('Paris');
      });
    });

    describe('when a path cannot be resolved', () => {
      const wrapper = {
        parsed_body: { id: 1 },
        headers: {},
      };

      it('throws MissingMappingVariable for a missing body field', () => {
        const resolver = PathResolver.fromExpression('parsed_body.missing_field');
        expect(() => resolver.resolve(wrapper)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.missing_field'
        );
      });

      it('throws MissingMappingVariable for a missing header', () => {
        const resolver = PathResolver.fromExpression("headers['missing']");
        expect(() => resolver.resolve(wrapper)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === "headers['missing']"
        );
      });

      it('throws MissingMappingVariable when traversing non-object', () => {
        const resolver = PathResolver.fromExpression('parsed_body.id.nested');
        expect(() => resolver.resolve(wrapper)).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.id.nested'
        );
      });
    });
  });
});
