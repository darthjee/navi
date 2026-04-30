import FilterParams from '../../src/utils/FilterParams.js';

describe('FilterParams', () => {
  describe('#parse', () => {
    describe('when the search string is empty', () => {
      it('returns an empty class array', () => {
        expect(new FilterParams('').parse()).toEqual({ class: [] });
      });
    });

    describe('when a single class filter is present', () => {
      it('returns a one-element class array', () => {
        expect(new FilterParams('?filters[class][]=ResourceRequestJob').parse())
          .toEqual({ class: ['ResourceRequestJob'] });
      });
    });

    describe('when multiple class filters are present', () => {
      it('returns all classes', () => {
        expect(
          new FilterParams('?filters[class][]=ResourceRequestJob&filters[class][]=HtmlParseJob').parse()
        ).toEqual({ class: ['ResourceRequestJob', 'HtmlParseJob'] });
      });
    });
  });

  describe('.serialize', () => {
    describe('when no classes are selected', () => {
      it('returns an empty string', () => {
        expect(FilterParams.serialize({ class: [] })).toBe('');
      });
    });

    describe('when a single class is selected', () => {
      it('returns the encoded query string', () => {
        expect(FilterParams.serialize({ class: ['ResourceRequestJob'] }))
          .toBe('filters[class][]=ResourceRequestJob');
      });
    });

    describe('when multiple classes are selected', () => {
      it('returns the joined encoded query string', () => {
        expect(FilterParams.serialize({ class: ['ResourceRequestJob', 'HtmlParseJob'] }))
          .toBe('filters[class][]=ResourceRequestJob&filters[class][]=HtmlParseJob');
      });
    });

    describe('when the class key is absent', () => {
      it('returns an empty string', () => {
        expect(FilterParams.serialize({})).toBe('');
      });
    });
  });
});

