import { Logger } from 'deku-sprout';
import { InvalidHtmlResponseBody } from '../../../lib/common/exceptions/request/InvalidHtmlResponseBody.js';
import { MissingParserField } from '../../../lib/exceptions/config/parser/MissingParserField.js';
import { MissingParserMatch } from '../../../lib/exceptions/config/parser/MissingParserMatch.js';
import { CssSelectorParser } from '../../../lib/parsers/CssSelectorParser.js';
import { CssSelectorHtmlFixtures } from '../../support/utils/CssSelectorHtmlFixtures.js';

const {
  product, tag, stock, category, title, linkedProduct, widgetAndGadget,
} = CssSelectorHtmlFixtures;

describe('CssSelectorParser', () => {
  let parser;

  beforeEach(() => {
    parser = new CssSelectorParser();
  });

  describe('#extract', () => {
    const itExtracts = (cases) => {
      cases.forEach(({ example, rawBody, attributes, expected }) => {
        it(example, () => {
          expect(parser.extract(rawBody, attributes)).toEqual(expected);
        });
      });
    };

    const describeExtracts = (cases) => {
      cases.forEach(({ description, ...scenario }) => {
        describe(description, () => itExtracts([scenario]));
      });
    };

    describe('when attributes.match is absent', () => {
      it('throws MissingParserMatch', () => {
        const rawBody = '<a href="/one">One</a>';
        const attributes = { field: 'href' };

        expect(() => parser.extract(rawBody, attributes)).toThrowError(
          MissingParserMatch,
          'Parser is missing the required "match" field',
        );
      });
    });

    describe('when fields is absent and field is also absent', () => {
      it('throws MissingParserField', () => {
        const rawBody = '<a href="/one">One</a>';
        const attributes = { match: 'a' };

        expect(() => parser.extract(rawBody, attributes)).toThrowError(
          MissingParserField,
          'Regex parser is missing the required "field" field',
        );
      });
    });

    describe('fallback mode', () => {
      describeExtracts([
        {
          description: 'when attribute is given',
          example: 'extracts the attribute value from each matched element',
          rawBody: '<a href="/one">One</a><a href="/two">Two</a>',
          attributes: { match: 'a', field: 'href', attribute: 'href' },
          expected: [{ href: '/one' }, { href: '/two' }],
        },
        {
          description: 'when attribute is absent',
          example: 'extracts the trimmed text content from each matched element',
          rawBody: '<h2>  Widget  </h2><h2>  Gadget  </h2>',
          attributes: { match: 'h2', field: 'title' },
          expected: [{ title: 'Widget' }, { title: 'Gadget' }],
        },
        {
          description: 'when trim is false',
          example: 'preserves the raw value',
          rawBody: '<h2>  Widget  </h2>',
          attributes: { match: 'h2', field: 'title', trim: false },
          expected: [{ title: '  Widget  ' }],
        },
        {
          description: 'when the attribute is present but empty',
          example: 'returns an empty string',
          rawBody: '<a href="">One</a>',
          attributes: { match: 'a', field: 'href', attribute: 'href' },
          expected: [{ href: '' }],
        },
        {
          description: 'when the attribute is absent from the element',
          example: 'returns null',
          rawBody: '<a>One</a>',
          attributes: { match: 'a', field: 'href', attribute: 'href' },
          expected: [{ href: null }],
        },
      ]);
    });

    describe('multi-field mode', () => {
      describeExtracts([
        {
          description: 'when fields mix selector-only, selector+attribute, and no-selector entries',
          example: 'returns one item per container with all fields populated',
          rawBody: `
            <div class="product" data-sku="A1"><h2>Widget</h2><a href="/widget">Buy</a></div>
            <div class="product" data-sku="A2"><h2>Gadget</h2><a href="/gadget">Buy</a></div>
          `,
          attributes: {
            match: '.product',
            fields: {
              title: { selector: 'h2' },
              link: { selector: 'a', attribute: 'href' },
              sku: { attribute: 'data-sku' },
            },
          },
          expected: [
            { title: 'Widget', link: '/widget', sku: 'A1' },
            { title: 'Gadget', link: '/gadget', sku: 'A2' },
          ],
        },
        {
          description: 'when a field selector matches nothing within the container',
          example: 'sets that field to null while still producing the item',
          rawBody: product(title('Widget')),
          attributes: {
            match: '.product',
            fields: {
              title: { selector: 'h2' },
              link: { selector: 'a', attribute: 'href' },
            },
          },
          expected: [{ title: 'Widget', link: null }],
        },
      ]);

      describe('when array is true', () => {
        describeExtracts([
          {
            description: 'and the relative selector matches multiple elements',
            example: 'collects all matches into an array',
            rawBody: product(tag('  new  '), tag('  sale  ')),
            attributes: { match: '.product', fields: { tags: { selector: '.tag', array: true } } },
            expected: [{ tags: ['new', 'sale'] }],
          },
          {
            description: 'and the relative selector matches nothing',
            example: 'returns an empty array, not null',
            rawBody: product(),
            attributes: { match: '.product', fields: { tags: { selector: '.tag', array: true } } },
            expected: [{ tags: [] }],
          },
          {
            description: 'and trim is false',
            example: 'preserves the raw value of each collected item',
            rawBody: product('<a href="/x">  Buy  </a>'),
            attributes: {
              match: '.product',
              fields: { raw: { selector: 'a', array: true, trim: false } },
            },
            expected: [{ raw: ['  Buy  '] }],
          },
        ]);
      });

      describe('when array is absent (default false)', () => {
        describeExtracts([
          {
            description: 'and the relative selector matches multiple elements',
            example: 'returns only the first match',
            rawBody: product(tag('new'), tag('sale')),
            attributes: { match: '.product', fields: { tag: { selector: '.tag' } } },
            expected: [{ tag: 'new' }],
          },
          {
            description: 'and the relative selector matches nothing',
            example: 'returns null',
            rawBody: product(),
            attributes: { match: '.product', fields: { tag: { selector: '.tag' } } },
            expected: [{ tag: null }],
          },
        ]);
      });
    });

    describe('filter', () => {
      const titleFields = { title: { selector: 'h2' } };
      const canonicalCondition = {
        selector: 'a.primary',
        attribute: 'href',
        equals_field: { selector: 'a.canonical', attribute: 'href' },
      };

      describeExtracts([
        {
          description: 'when a single equals condition is given',
          example: 'includes only containers matching the condition',
          rawBody: product(stock('true'), title('Widget')) + product(stock('false'), title('Gadget')),
          attributes: {
            match: '.product',
            filter: [{ selector: '.stock', attribute: 'data-available', equals: 'true' }],
            fields: titleFields,
          },
          expected: [{ title: 'Widget' }],
        },
        {
          description: 'when multiple conditions are given (AND)',
          example: 'includes only containers matching every condition',
          rawBody: product(stock('true'), category('books'), title('Widget'))
            + product(stock('true'), category('toys'), title('Gadget')),
          attributes: {
            match: '.product',
            filter: [
              { selector: '.stock', attribute: 'data-available', equals: 'true' },
              { selector: '.category', equals: 'books' },
            ],
            fields: titleFields,
          },
          expected: [{ title: 'Widget' }],
        },
        {
          description: 'when a container is missing both sides of an equals_field condition',
          example: 'keeps the container (both sides resolve null)',
          rawBody: product(title('Widget')),
          attributes: { match: '.product', filter: [canonicalCondition], fields: titleFields },
          expected: [{ title: 'Widget' }],
        },
        {
          description: 'when array is set inside a filter condition',
          example: 'ignores it and compares scalars',
          rawBody: linkedProduct('Widget', '/product/widget', '/product/widget'),
          attributes: {
            match: '.product',
            filter: [{
              ...canonicalCondition,
              array: true,
              equals_field: { ...canonicalCondition.equals_field, array: true },
            }],
            fields: titleFields,
          },
          expected: [{ title: 'Widget' }],
        },
      ]);

      describe('when an equals_field condition is given', () => {
        itExtracts([
          {
            example: 'keeps only containers where both sides resolve equal',
            rawBody: widgetAndGadget(),
            attributes: { match: '.product', filter: [canonicalCondition], fields: titleFields },
            expected: [{ title: 'Widget' }],
          },
          {
            example: 'behaves the same in fallback single-field mode',
            rawBody: widgetAndGadget(),
            attributes: {
              match: '.product',
              filter: [canonicalCondition],
              field: 'title',
              attribute: 'data-name',
            },
            expected: [{ title: null }],
          },
        ]);
      });

      describe('when a condition carries both equals and equals_field', () => {
        it('lets equals_field win and warns once', () => {
          spyOn(Logger, 'warn');

          const attributes = {
            match: '.product',
            filter: [{ ...canonicalCondition, equals: '/never' }],
            fields: titleFields,
          };

          expect(parser.extract(widgetAndGadget(), attributes)).toEqual([{ title: 'Widget' }]);
          expect(Logger.warn).toHaveBeenCalledTimes(1);
        });
      });
    });

    describeExtracts([
      {
        description: 'when match matches zero elements',
        example: 'returns an empty array',
        rawBody: '<div class="other"></div>',
        attributes: { match: '.product', field: 'title' },
        expected: [],
      },
    ]);

    describe('when rawBody cannot be parsed as HTML', () => {
      it('throws InvalidHtmlResponseBody', () => {
        const attributes = { match: 'a', field: 'href' };

        expect(() => parser.extract(null, attributes)).toThrowError(InvalidHtmlResponseBody);
      });
    });
  });
});
