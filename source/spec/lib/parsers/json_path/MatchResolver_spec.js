import { InvalidParserMatch } from '../../../../lib/exceptions/config/InvalidParserMatch.js';
import { MatchResolver } from '../../../../lib/parsers/json_path/MatchResolver.js';

describe('MatchResolver', () => {
  describe('#resolve', () => {
    describe('when match is a flat top-level key', () => {
      it('returns the resolved array', () => {
        const resolver = new MatchResolver('items');
        const parsedBody = { items: [{ id: 1 }, { id: 2 }] };

        expect(resolver.resolve(parsedBody)).toEqual([{ id: 1 }, { id: 2 }]);
      });
    });

    describe('when match is a nested dot-notation path', () => {
      it('returns the resolved array', () => {
        const resolver = new MatchResolver('data.items');
        const parsedBody = { data: { items: [{ id: 1 }] } };

        expect(resolver.resolve(parsedBody)).toEqual([{ id: 1 }]);
      });
    });

    describe('when match resolves to a non-array value', () => {
      it('throws InvalidParserMatch', () => {
        const resolver = new MatchResolver('items');
        const parsedBody = { items: { not: 'an array' } };

        expect(() => resolver.resolve(parsedBody)).toThrowMatching(
          (error) => error instanceof InvalidParserMatch && error.match === 'items',
        );
      });
    });

    describe('when a match path segment is missing from the parsed body', () => {
      it('throws InvalidParserMatch', () => {
        const resolver = new MatchResolver('data.items');
        const parsedBody = { data: {} };

        expect(() => resolver.resolve(parsedBody)).toThrowMatching(
          (error) => error instanceof InvalidParserMatch && error.match === 'data.items',
        );
      });
    });
  });
});
