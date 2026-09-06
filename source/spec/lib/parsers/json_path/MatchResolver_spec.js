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

    describe('when match is omitted', () => {
      it('returns the parsed body itself when it is an array', () => {
        const resolver = new MatchResolver(undefined);
        const parsedBody = [{ id: 1 }, { id: 2 }];

        expect(resolver.resolve(parsedBody)).toEqual([{ id: 1 }, { id: 2 }]);
      });

      describe('and the parsed body is not an array', () => {
        it('throws InvalidParserMatch normalising the marker to "."', () => {
          const resolver = new MatchResolver(undefined);
          const parsedBody = { not: 'an array' };

          expect(() => resolver.resolve(parsedBody)).toThrowMatching(
            (error) => error instanceof InvalidParserMatch && error.match === '.',
          );
        });
      });
    });

    describe('when match is an empty string', () => {
      it('returns the parsed body itself when it is an array', () => {
        const resolver = new MatchResolver('');
        const parsedBody = [{ id: 1 }];

        expect(resolver.resolve(parsedBody)).toEqual([{ id: 1 }]);
      });
    });

    describe('when match is exactly "."', () => {
      it('returns the parsed body itself when it is an array', () => {
        const resolver = new MatchResolver('.');
        const parsedBody = [{ id: 1 }];

        expect(resolver.resolve(parsedBody)).toEqual([{ id: 1 }]);
      });

      describe('and the parsed body is not an array', () => {
        it('throws InvalidParserMatch', () => {
          const resolver = new MatchResolver('.');
          const parsedBody = { not: 'an array' };

          expect(() => resolver.resolve(parsedBody)).toThrowMatching(
            (error) => error instanceof InvalidParserMatch && error.match === '.',
          );
        });
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
