import { MissingParserField } from '../../../../lib/exceptions/config/MissingParserField.js';
import { MissingParserMatch } from '../../../../lib/exceptions/config/MissingParserMatch.js';
import { AttributesValidator } from '../../../../lib/parsers/regex_parser/AttributesValidator.js';

describe('AttributesValidator', () => {
  describe('#validate', () => {
    describe('when both match and field are present', () => {
      it('does not throw', () => {
        const validator = new AttributesValidator({ match: 'world', field: 'greeting' });

        expect(() => validator.validate()).not.toThrow();
      });
    });

    describe('when match is absent', () => {
      it('throws MissingParserMatch', () => {
        const validator = new AttributesValidator({ field: 'greeting' });

        expect(() => validator.validate()).toThrowError(
          MissingParserMatch,
          'Parser is missing the required "match" field',
        );
      });
    });

    describe('when field is absent', () => {
      it('throws MissingParserField', () => {
        const validator = new AttributesValidator({ match: 'world' });

        expect(() => validator.validate()).toThrowError(
          MissingParserField,
          'Regex parser is missing the required "field" field',
        );
      });
    });
  });
});
