import { MissingParserField } from '../../../lib/exceptions/config/MissingParserField.js';
import { MissingParserMatch } from '../../../lib/exceptions/config/MissingParserMatch.js';
import { InvalidHtmlResponseBody } from '../../../lib/exceptions/request/InvalidHtmlResponseBody.js';
import { CssSelectorParser } from '../../../lib/parsers/CssSelectorParser.js';

describe('CssSelectorParser', () => {
  let parser;

  beforeEach(() => {
    parser = new CssSelectorParser();
  });

  describe('#extract', () => {
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
      describe('when attribute is given', () => {
        it('extracts the attribute value from each matched element', () => {
          const rawBody = '<a href="/one">One</a><a href="/two">Two</a>';
          const attributes = { match: 'a', field: 'href', attribute: 'href' };

          expect(parser.extract(rawBody, attributes)).toEqual([
            { href: '/one' },
            { href: '/two' },
          ]);
        });
      });

      describe('when attribute is absent', () => {
        it('extracts the trimmed text content from each matched element', () => {
          const rawBody = '<h2>  Widget  </h2><h2>  Gadget  </h2>';
          const attributes = { match: 'h2', field: 'title' };

          expect(parser.extract(rawBody, attributes)).toEqual([
            { title: 'Widget' },
            { title: 'Gadget' },
          ]);
        });
      });

      describe('when trim is false', () => {
        it('preserves the raw value', () => {
          const rawBody = '<h2>  Widget  </h2>';
          const attributes = { match: 'h2', field: 'title', trim: false };

          expect(parser.extract(rawBody, attributes)).toEqual([{ title: '  Widget  ' }]);
        });
      });

      describe('when the attribute is present but empty', () => {
        it('returns an empty string', () => {
          const rawBody = '<a href="">One</a>';
          const attributes = { match: 'a', field: 'href', attribute: 'href' };

          expect(parser.extract(rawBody, attributes)).toEqual([{ href: '' }]);
        });
      });

      describe('when the attribute is absent from the element', () => {
        it('returns null', () => {
          const rawBody = '<a>One</a>';
          const attributes = { match: 'a', field: 'href', attribute: 'href' };

          expect(parser.extract(rawBody, attributes)).toEqual([{ href: null }]);
        });
      });
    });

    describe('multi-field mode', () => {
      describe('when fields mix selector-only, selector+attribute, and no-selector entries', () => {
        it('returns one item per container with all fields populated', () => {
          const rawBody = `
            <div class="product" data-sku="A1">
              <h2>Widget</h2>
              <a href="/widget">Buy</a>
            </div>
            <div class="product" data-sku="A2">
              <h2>Gadget</h2>
              <a href="/gadget">Buy</a>
            </div>
          `;
          const attributes = {
            match: '.product',
            fields: {
              title: { selector: 'h2' },
              link: { selector: 'a', attribute: 'href' },
              sku: { attribute: 'data-sku' },
            },
          };

          expect(parser.extract(rawBody, attributes)).toEqual([
            { title: 'Widget', link: '/widget', sku: 'A1' },
            { title: 'Gadget', link: '/gadget', sku: 'A2' },
          ]);
        });
      });

      describe('when a field selector matches nothing within the container', () => {
        it('sets that field to null while still producing the item', () => {
          const rawBody = '<div class="product"><h2>Widget</h2></div>';
          const attributes = {
            match: '.product',
            fields: {
              title: { selector: 'h2' },
              link: { selector: 'a', attribute: 'href' },
            },
          };

          expect(parser.extract(rawBody, attributes)).toEqual([{ title: 'Widget', link: null }]);
        });
      });

      describe('when array is true', () => {
        describe('and the relative selector matches multiple elements', () => {
          it('collects all matches into an array', () => {
            const rawBody = `
              <div class="product">
                <span class="tag">  new  </span>
                <span class="tag">  sale  </span>
              </div>
            `;
            const attributes = {
              match: '.product',
              fields: { tags: { selector: '.tag', array: true } },
            };

            expect(parser.extract(rawBody, attributes)).toEqual([{ tags: ['new', 'sale'] }]);
          });
        });

        describe('and the relative selector matches nothing', () => {
          it('returns an empty array, not null', () => {
            const rawBody = '<div class="product"></div>';
            const attributes = {
              match: '.product',
              fields: { tags: { selector: '.tag', array: true } },
            };

            expect(parser.extract(rawBody, attributes)).toEqual([{ tags: [] }]);
          });
        });

        describe('and trim is false', () => {
          it('preserves the raw value of each collected item', () => {
            const rawBody = '<div class="product"><a href="/x">  Buy  </a></div>';
            const attributes = {
              match: '.product',
              fields: { raw: { selector: 'a', array: true, trim: false } },
            };

            expect(parser.extract(rawBody, attributes)).toEqual([{ raw: ['  Buy  '] }]);
          });
        });
      });

      describe('when array is absent (default false)', () => {
        describe('and the relative selector matches multiple elements', () => {
          it('returns only the first match', () => {
            const rawBody = `
              <div class="product">
                <span class="tag">new</span>
                <span class="tag">sale</span>
              </div>
            `;
            const attributes = {
              match: '.product',
              fields: { tag: { selector: '.tag' } },
            };

            expect(parser.extract(rawBody, attributes)).toEqual([{ tag: 'new' }]);
          });
        });

        describe('and the relative selector matches nothing', () => {
          it('returns null', () => {
            const rawBody = '<div class="product"></div>';
            const attributes = {
              match: '.product',
              fields: { tag: { selector: '.tag' } },
            };

            expect(parser.extract(rawBody, attributes)).toEqual([{ tag: null }]);
          });
        });
      });
    });

    describe('filter', () => {
      describe('when a single equals condition is given', () => {
        it('includes only containers matching the condition', () => {
          const rawBody = `
            <div class="product">
              <span class="stock" data-available="true"></span>
              <h2>Widget</h2>
            </div>
            <div class="product">
              <span class="stock" data-available="false"></span>
              <h2>Gadget</h2>
            </div>
          `;
          const attributes = {
            match: '.product',
            filter: [{ selector: '.stock', attribute: 'data-available', equals: 'true' }],
            fields: { title: { selector: 'h2' } },
          };

          expect(parser.extract(rawBody, attributes)).toEqual([{ title: 'Widget' }]);
        });
      });

      describe('when multiple conditions are given (AND)', () => {
        it('includes only containers matching every condition', () => {
          const rawBody = `
            <div class="product">
              <span class="stock" data-available="true"></span>
              <span class="category">books</span>
              <h2>Widget</h2>
            </div>
            <div class="product">
              <span class="stock" data-available="true"></span>
              <span class="category">toys</span>
              <h2>Gadget</h2>
            </div>
          `;
          const attributes = {
            match: '.product',
            filter: [
              { selector: '.stock', attribute: 'data-available', equals: 'true' },
              { selector: '.category', equals: 'books' },
            ],
            fields: { title: { selector: 'h2' } },
          };

          expect(parser.extract(rawBody, attributes)).toEqual([{ title: 'Widget' }]);
        });
      });
    });

    describe('when match matches zero elements', () => {
      it('returns an empty array', () => {
        const rawBody = '<div class="other"></div>';
        const attributes = { match: '.product', field: 'title' };

        expect(parser.extract(rawBody, attributes)).toEqual([]);
      });
    });

    describe('when rawBody cannot be parsed as HTML', () => {
      it('throws InvalidHtmlResponseBody', () => {
        const attributes = { match: 'a', field: 'href' };

        expect(() => parser.extract(null, attributes)).toThrowError(InvalidHtmlResponseBody);
      });
    });
  });
});
