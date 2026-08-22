import { MissingParserField } from '../../../lib/exceptions/config/MissingParserField.js';
import { MissingParserMatch } from '../../../lib/exceptions/config/MissingParserMatch.js';
import { RegexParser } from '../../../lib/parsers/RegexParser.js';

describe('RegexParser', () => {
  let parser;

  beforeEach(() => {
    parser = new RegexParser();
  });

  describe('#extract', () => {
    describe('when the pattern matches with a capturing group', () => {
      it('returns a single item with the captured value under the configured field', () => {
        const rawBody = 'price: $42.50 total';
        const attributes = { match: '\\$(\\d+\\.\\d+)', field: 'price' };

        expect(parser.extract(rawBody, attributes)).toEqual([{ price: '42.50' }]);
      });
    });

    describe('when the pattern matches without a capturing group', () => {
      it('returns a single item with the full match under the configured field', () => {
        const rawBody = 'hello world';
        const attributes = { match: 'world', field: 'greeting' };

        expect(parser.extract(rawBody, attributes)).toEqual([{ greeting: 'world' }]);
      });
    });

    describe('when the pattern does not match', () => {
      it('returns an empty array', () => {
        const rawBody = 'hello world';
        const attributes = { match: 'goodbye', field: 'greeting' };

        expect(parser.extract(rawBody, attributes)).toEqual([]);
      });
    });

    describe('when attributes.match is absent', () => {
      it('throws MissingParserMatch', () => {
        const rawBody = 'hello world';
        const attributes = { field: 'greeting' };

        expect(() => parser.extract(rawBody, attributes)).toThrowError(
          MissingParserMatch,
          'Regex parser is missing the required "match" field',
        );
      });
    });

    describe('when attributes.field is absent', () => {
      it('throws MissingParserField', () => {
        const rawBody = 'hello world';
        const attributes = { match: 'world' };

        expect(() => parser.extract(rawBody, attributes)).toThrowError(
          MissingParserField,
          'Regex parser is missing the required "field" field',
        );
      });
    });
  });
});
