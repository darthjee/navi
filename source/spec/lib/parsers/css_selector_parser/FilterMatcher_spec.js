import { FilterMatcher } from '../../../../lib/parsers/css_selector_parser/FilterMatcher.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';

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

    describe('when an equals condition and an equals_field condition are AND\'ed', () => {
      const buildContainer = (canonicalHref) => {
        const stock = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('true'),
        };
        const primary = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/product/1'),
        };
        const canonical = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue(canonicalHref),
        };

        return {
          querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => ({
            '.stock': stock,
            'a.primary': primary,
            'a.canonical': canonical,
          }[selector])),
        };
      };
      const filter = [
        { selector: '.stock', attribute: 'data-available', equals: 'true' },
        {
          selector: 'a.primary',
          attribute: 'href',
          equals_field: { selector: 'a.canonical', attribute: 'href' },
        },
      ];

      describe('and every condition passes', () => {
        it('returns true', () => {
          expect(new FilterMatcher(filter).matches(buildContainer('/product/1'))).toBe(true);
        });
      });

      describe('and the equals_field condition fails', () => {
        it('returns false', () => {
          expect(new FilterMatcher(filter).matches(buildContainer('/product/2'))).toBe(false);
        });
      });
    });
  });

  describe('#warnConflicts', () => {
    beforeEach(() => {
      spyOn(Logger, 'warn');
    });

    describe('when a condition carries both equals and equals_field', () => {
      it('warns once per offending condition', () => {
        const filter = [
          { selector: '.category', equals: 'books' },
          {
            selector: 'a.primary',
            attribute: 'href',
            equals: '/never',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          },
          {
            selector: 'a.other',
            equals: 'x',
            equals_field: { selector: 'a.mirror' },
          },
        ];

        new FilterMatcher(filter).warnConflicts();

        expect(Logger.warn).toHaveBeenCalledTimes(2);
      });
    });

    describe('when no condition carries both keys', () => {
      it('does not warn', () => {
        const filter = [
          { selector: '.category', equals: 'books' },
          {
            selector: 'a.primary',
            attribute: 'href',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          },
        ];

        new FilterMatcher(filter).warnConflicts();

        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });

    describe('when filter is absent', () => {
      it('does not warn', () => {
        new FilterMatcher(undefined).warnConflicts();

        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });

    describe('when filter is empty', () => {
      it('does not warn', () => {
        new FilterMatcher([]).warnConflicts();

        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });
  });
});
