import { InvalidParserMatch } from '../../../lib/exceptions/config/InvalidParserMatch.js';
import { MissingParserFields } from '../../../lib/exceptions/config/MissingParserFields.js';
import { MissingParserMatch } from '../../../lib/exceptions/config/MissingParserMatch.js';
import { JsonPathParser } from '../../../lib/parsers/JsonPathParser.js';

describe('JsonPathParser', () => {
  let parser;

  beforeEach(() => {
    parser = new JsonPathParser();
  });

  describe('#extract', () => {
    describe('when match is a flat top-level key', () => {
      it('extracts and maps fields from every matched item', () => {
        const rawBody = JSON.stringify({
          bundleObjs: [
            { obj_inid: 1, obj_title: 'Miniature A', obj_post_id: 10, bnd_title: 'Bundle A' },
            { obj_inid: 2, obj_title: 'Miniature B', obj_post_id: 11, bnd_title: 'Bundle B' },
          ],
        });
        const attributes = {
          match: 'bundleObjs',
          fields: {
            obj_inid: 'inid',
            obj_title: 'name',
            obj_post_id: 'post_id',
            bnd_title: 'bundle',
          },
        };

        expect(parser.extract(rawBody, attributes)).toEqual([
          { inid: 1, name: 'Miniature A', post_id: 10, bundle: 'Bundle A' },
          { inid: 2, name: 'Miniature B', post_id: 11, bundle: 'Bundle B' },
        ]);
      });
    });

    describe('when match is a nested dot-notation path', () => {
      it('extracts and maps fields from the nested array', () => {
        const rawBody = JSON.stringify({
          data: { items: [{ id: 1, title: 'Item A' }] },
        });
        const attributes = {
          match: 'data.items',
          fields: { id: 'itemId', title: 'itemTitle' },
        };

        expect(parser.extract(rawBody, attributes)).toEqual([
          { itemId: 1, itemTitle: 'Item A' },
        ]);
      });
    });

    describe('when filter has a single literal condition', () => {
      it('returns only items matching the literal condition', () => {
        const rawBody = JSON.stringify({
          items: [
            { obj_type: 'miniature', obj_inid: 1 },
            { obj_type: 'accessory', obj_inid: 2 },
          ],
        });
        const attributes = {
          match: 'items',
          filter: [{ field: 'obj_type', equals: 'miniature' }],
          fields: { obj_inid: 'inid' },
        };

        expect(parser.extract(rawBody, attributes)).toEqual([{ inid: 1 }]);
      });
    });

    describe('when filter has a single field-to-field condition', () => {
      it('returns only items where both fields are equal', () => {
        const rawBody = JSON.stringify({
          items: [
            { bnd_inid: 5, bundle_inid: 5, obj_inid: 1 },
            { bnd_inid: 5, bundle_inid: 6, obj_inid: 2 },
          ],
        });
        const attributes = {
          match: 'items',
          filter: [{ field: 'bnd_inid', equals_field: 'bundle_inid' }],
          fields: { obj_inid: 'inid' },
        };

        expect(parser.extract(rawBody, attributes)).toEqual([{ inid: 1 }]);
      });
    });

    describe('when filter combines a literal and a field-to-field condition', () => {
      it('returns only items passing both conditions (AND)', () => {
        const rawBody = JSON.stringify({
          items: [
            { obj_type: 'miniature', bnd_inid: 5, bundle_inid: 5, obj_inid: 1 },
            { obj_type: 'miniature', bnd_inid: 5, bundle_inid: 6, obj_inid: 2 },
            { obj_type: 'accessory', bnd_inid: 5, bundle_inid: 5, obj_inid: 3 },
          ],
        });
        const attributes = {
          match: 'items',
          filter: [
            { field: 'obj_type', equals: 'miniature' },
            { field: 'bnd_inid', equals_field: 'bundle_inid' },
          ],
          fields: { obj_inid: 'inid' },
        };

        expect(parser.extract(rawBody, attributes)).toEqual([{ inid: 1 }]);
      });
    });

    describe('when filter is absent', () => {
      it('returns every matched item', () => {
        const rawBody = JSON.stringify({ items: [{ id: 1 }, { id: 2 }] });
        const attributes = { match: 'items', fields: { id: 'itemId' } };

        expect(parser.extract(rawBody, attributes)).toEqual([
          { itemId: 1 },
          { itemId: 2 },
        ]);
      });
    });

    describe('when match resolves to an empty array', () => {
      it('returns an empty array', () => {
        const rawBody = JSON.stringify({ items: [] });
        const attributes = { match: 'items', fields: { id: 'itemId' } };

        expect(parser.extract(rawBody, attributes)).toEqual([]);
      });
    });

    describe('when filter excludes every item', () => {
      it('returns an empty array', () => {
        const rawBody = JSON.stringify({ items: [{ obj_type: 'accessory' }] });
        const attributes = {
          match: 'items',
          filter: [{ field: 'obj_type', equals: 'miniature' }],
          fields: { obj_type: 'type' },
        };

        expect(parser.extract(rawBody, attributes)).toEqual([]);
      });
    });

    describe('when attributes.match is absent', () => {
      it('throws MissingParserMatch', () => {
        const rawBody = JSON.stringify({ items: [] });
        const attributes = { fields: { id: 'itemId' } };

        expect(() => parser.extract(rawBody, attributes)).toThrowError(
          MissingParserMatch,
          'Parser is missing the required "match" field',
        );
      });
    });

    describe('when attributes.fields is absent', () => {
      it('throws MissingParserFields', () => {
        const rawBody = JSON.stringify({ items: [] });
        const attributes = { match: 'items' };

        expect(() => parser.extract(rawBody, attributes)).toThrowError(
          MissingParserFields,
          'Parser is missing the required "fields" field',
        );
      });
    });

    describe('when a match path segment is missing from the parsed body', () => {
      it('throws InvalidParserMatch', () => {
        const rawBody = JSON.stringify({ data: {} });
        const attributes = { match: 'data.items', fields: { id: 'itemId' } };

        expect(() => parser.extract(rawBody, attributes)).toThrowMatching(
          (error) => error instanceof InvalidParserMatch && error.match === 'data.items',
        );
      });
    });

    describe('when match resolves to a non-array value', () => {
      it('throws InvalidParserMatch', () => {
        const rawBody = JSON.stringify({ items: { not: 'an array' } });
        const attributes = { match: 'items', fields: { id: 'itemId' } };

        expect(() => parser.extract(rawBody, attributes)).toThrowMatching(
          (error) => error instanceof InvalidParserMatch && error.match === 'items',
        );
      });
    });
  });
});
