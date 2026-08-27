import { PatternMatcher } from '../../../../lib/parsers/regex_parser/PatternMatcher.js';

describe('PatternMatcher', () => {
  describe('#exec', () => {
    describe('when the pattern matches with a capturing group', () => {
      it('returns the exec result with the captured value at index 1', () => {
        const matcher = new PatternMatcher('\\$(\\d+\\.\\d+)');
        const rawBody = 'price: $42.50 total';

        const result = matcher.exec(rawBody);

        expect(result[0]).toEqual('$42.50');
        expect(result[1]).toEqual('42.50');
      });
    });

    describe('when the pattern matches without a capturing group', () => {
      it('returns the exec result with only the full match at index 0', () => {
        const matcher = new PatternMatcher('world');
        const rawBody = 'hello world';

        const result = matcher.exec(rawBody);

        expect(result[0]).toEqual('world');
        expect(result[1]).toBeUndefined();
      });
    });

    describe('when the pattern does not match', () => {
      it('returns null', () => {
        const matcher = new PatternMatcher('goodbye');
        const rawBody = 'hello world';

        expect(matcher.exec(rawBody)).toBeNull();
      });
    });
  });
});
