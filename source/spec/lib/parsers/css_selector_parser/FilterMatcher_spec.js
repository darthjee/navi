import { FilterMatcher } from '../../../../lib/parsers/css_selector_parser/FilterMatcher.js';

describe('FilterMatcher', () => {
  describe('#matches', () => {
    describe('when filter is absent', () => {
      it('returns true', () => {
        expect(new FilterMatcher(undefined).matches({})).toBe(true);
      });
    });

    describe('when filter is empty', () => {
      it('returns true', () => {
        expect(new FilterMatcher([]).matches({})).toBe(true);
      });
    });

    describe('when every condition matches', () => {
      it('returns true', () => {
        const stock = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('true'),
        };
        const category = { text: 'books' };
        const container = {
          querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
            selector === '.stock' ? stock : category
          )),
        };
        const filter = [
          { selector: '.stock', attribute: 'data-available', equals: 'true' },
          { selector: '.category', equals: 'books' },
        ];

        expect(new FilterMatcher(filter).matches(container)).toBe(true);
      });
    });

    describe('when one condition fails', () => {
      it('returns false', () => {
        const stock = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('false'),
        };
        const container = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(stock),
        };
        const filter = [
          { selector: '.stock', attribute: 'data-available', equals: 'true' },
        ];

        expect(new FilterMatcher(filter).matches(container)).toBe(false);
      });
    });
  });
});
