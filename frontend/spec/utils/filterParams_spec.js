import { parseFilterParams, serializeFilterParams } from '../../src/utils/filterParams.js';

describe('filterParams', () => {
  describe('parseFilterParams', () => {
    describe('when the search string is empty', () => {
      it('returns an empty class array', () => {
        expect(parseFilterParams('')).toEqual({ class: [] });
      });
    });

    describe('when a single class filter is present', () => {
      it('returns a one-element class array', () => {
        expect(parseFilterParams('?filters[class][]=ResourceRequestJob'))
          .toEqual({ class: ['ResourceRequestJob'] });
      });
    });

    describe('when multiple class filters are present', () => {
      it('returns all classes', () => {
        expect(
          parseFilterParams('?filters[class][]=ResourceRequestJob&filters[class][]=HtmlParseJob')
        ).toEqual({ class: ['ResourceRequestJob', 'HtmlParseJob'] });
      });
    });
  });

  describe('serializeFilterParams', () => {
    describe('when no classes are selected', () => {
      it('returns an empty string', () => {
        expect(serializeFilterParams({ class: [] })).toBe('');
      });
    });

    describe('when a single class is selected', () => {
      it('returns the encoded query string', () => {
        expect(serializeFilterParams({ class: ['ResourceRequestJob'] }))
          .toBe('filters[class][]=ResourceRequestJob');
      });
    });

    describe('when multiple classes are selected', () => {
      it('returns the joined encoded query string', () => {
        expect(serializeFilterParams({ class: ['ResourceRequestJob', 'HtmlParseJob'] }))
          .toBe('filters[class][]=ResourceRequestJob&filters[class][]=HtmlParseJob');
      });
    });

    describe('when the class key is absent', () => {
      it('returns an empty string', () => {
        expect(serializeFilterParams({})).toBe('');
      });
    });
  });
});
