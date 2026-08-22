import { ParserNotFound } from '../../../lib/exceptions/registry/ParserNotFound.js';
import { RegexParser } from '../../../lib/parsers/RegexParser.js';
import { ParserRegistry } from '../../../lib/registry/ParserRegistry.js';

describe('ParserRegistry', () => {
  let regexParser;
  let parserRegistry;

  beforeEach(() => {
    regexParser = new RegexParser();
    parserRegistry = new ParserRegistry({ regex: regexParser });
  });

  describe('#getItem', () => {
    describe('when the parser type is registered', () => {
      it('returns the registered parser instance', () => {
        expect(parserRegistry.getItem('regex')).toBe(regexParser);
      });
    });

    describe('when the parser type is not registered', () => {
      it('throws ParserNotFound with the missing type', () => {
        expect(() => parserRegistry.getItem('json_path')).toThrowError(
          ParserNotFound,
          'Parser "json_path" not found.',
        );
      });
    });
  });
});
