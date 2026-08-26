import { InvalidParserType } from '../../../../lib/exceptions/config/InvalidParserType.js';
import { ResourceRequestParser } from '../../../../lib/models/request/ResourceRequestParser.js';

describe('ResourceRequestParser', () => {
  describe('constructor', () => {
    describe('with type "regex"', () => {
      it('sets type and stores the extra keys as attributes', () => {
        const parser = new ResourceRequestParser({
          type: 'regex',
          match: '\\d+',
          field: 'id',
        });

        expect(parser.type).toBe('regex');
        expect(parser.attributes).toEqual({ match: '\\d+', field: 'id' });
      });
    });

    describe('with type "json_path"', () => {
      it('sets type and stores the extra keys as attributes', () => {
        const parser = new ResourceRequestParser({
          type: 'json_path',
          filter: 'data[*]',
          fields: { id: 'id', name: 'name' },
        });

        expect(parser.type).toBe('json_path');
        expect(parser.attributes).toEqual({ filter: 'data[*]', fields: { id: 'id', name: 'name' } });
      });
    });

    describe('with type "css"', () => {
      it('sets type and stores the extra keys as attributes', () => {
        const parser = new ResourceRequestParser({
          type: 'css',
          match: '.product',
          fields: { title: { selector: 'h2' } },
        });

        expect(parser.type).toBe('css');
        expect(parser.attributes).toEqual({ match: '.product', fields: { title: { selector: 'h2' } } });
      });
    });

    describe('with no extra keys', () => {
      it('stores an empty attributes object', () => {
        const parser = new ResourceRequestParser({ type: 'regex' });

        expect(parser.attributes).toEqual({});
      });
    });

    describe('with a missing type', () => {
      it('throws InvalidParserType', () => {
        expect(() => new ResourceRequestParser({}))
          .toThrowMatching((error) => error instanceof InvalidParserType);
      });
    });

    describe('with an unknown type', () => {
      it('throws InvalidParserType', () => {
        expect(() => new ResourceRequestParser({ type: 'xml_path' }))
          .toThrowMatching((error) => error instanceof InvalidParserType);
      });
    });
  });

  describe('.fromObject', () => {
    it('returns a ResourceRequestParser instance', () => {
      const parser = ResourceRequestParser.fromObject({ type: 'regex', match: '\\d+' });

      expect(parser).toBeInstanceOf(ResourceRequestParser);
      expect(parser.type).toBe('regex');
    });
  });
});
