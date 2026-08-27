import { MatchValueExtractor } from '../../../../lib/parsers/regex_parser/MatchValueExtractor.js';

describe('MatchValueExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new MatchValueExtractor();
  });

  describe('#extract', () => {
    describe('when the result has a captured group', () => {
      it('returns the captured group value', () => {
        const result = ['$42.50', '42.50'];

        expect(extractor.extract(result)).toEqual('42.50');
      });
    });

    describe('when the result has no captured group', () => {
      it('returns the full match', () => {
        const result = ['world'];

        expect(extractor.extract(result)).toEqual('world');
      });
    });
  });
});
