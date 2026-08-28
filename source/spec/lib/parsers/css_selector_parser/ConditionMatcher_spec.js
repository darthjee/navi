import { ConditionMatcher } from '../../../../lib/parsers/css_selector_parser/ConditionMatcher.js';

describe('ConditionMatcher', () => {
  describe('#matches', () => {
    describe('when the resolved value equals the literal', () => {
      it('returns true', () => {
        const target = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('true'),
        };
        const container = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(target),
        };
        const matcher = new ConditionMatcher({
          selector: '.stock',
          attribute: 'data-available',
          equals: 'true',
        });

        expect(matcher.matches(container)).toBe(true);
      });
    });

    describe('when the resolved value differs from the literal', () => {
      it('returns false', () => {
        const target = { text: 'books' };
        const container = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(target),
        };

        expect(new ConditionMatcher({ selector: '.category', equals: 'toys' }).matches(container))
          .toBe(false);
      });
    });

    describe('when selector is absent', () => {
      it('resolves the container itself', () => {
        const container = { text: '  books  ' };

        expect(new ConditionMatcher({ equals: 'books' }).matches(container)).toBe(true);
      });
    });

    describe('when trim is false', () => {
      it('compares the untrimmed value', () => {
        const container = { text: '  books  ' };

        expect(new ConditionMatcher({ trim: false, equals: '  books  ' }).matches(container))
          .toBe(true);
      });
    });

    describe('when equals_field is given', () => {
      describe('and both sides resolve to the same value', () => {
        it('returns true', () => {
          const primary = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/product/1'),
          };
          const canonical = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/product/1'),
          };
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
              selector === 'a.primary' ? primary : canonical
            )),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            attribute: 'href',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          });

          expect(matcher.matches(container)).toBe(true);
        });
      });

      describe('and the two sides resolve to different values', () => {
        it('returns false', () => {
          const primary = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/product/1'),
          };
          const canonical = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/product/2'),
          };
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
              selector === 'a.primary' ? primary : canonical
            )),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            attribute: 'href',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          });

          expect(matcher.matches(container)).toBe(false);
        });
      });

      describe('and both sides resolve to null', () => {
        it('returns true', () => {
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.returnValue(null),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            attribute: 'href',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          });

          expect(matcher.matches(container)).toBe(true);
        });
      });

      describe('and one side resolves to null and the other to a string', () => {
        it('returns false', () => {
          const primary = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/product/1'),
          };
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
              selector === 'a.primary' ? primary : null
            )),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            attribute: 'href',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          });

          expect(matcher.matches(container)).toBe(false);
        });
      });

      describe('and the right side sets trim to false', () => {
        it('trims each side independently', () => {
          const primary = { text: '  sku-1  ' };
          const canonical = { text: '  sku-1  ' };
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
              selector === 'a.primary' ? primary : canonical
            )),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            equals_field: { selector: 'a.canonical', trim: false },
          });

          expect(matcher.matches(container)).toBe(false);
        });
      });

      describe('and the right side reads text content while the left reads an attribute', () => {
        it('compares the two independent resolutions', () => {
          const primary = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('books'),
          };
          const canonical = { text: 'books' };
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
              selector === 'a.primary' ? primary : canonical
            )),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            attribute: 'data-category',
            equals_field: { selector: 'span.category' },
          });

          expect(matcher.matches(container)).toBe(true);
        });
      });

      describe('and the right side omits selector', () => {
        it('resolves the container itself', () => {
          const primary = { text: 'books' };
          const container = {
            text: 'books',
            querySelector: jasmine.createSpy('querySelector').and.returnValue(primary),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            equals_field: {},
          });

          expect(matcher.matches(container)).toBe(true);
        });
      });

      describe('and equals is also present', () => {
        it('takes the equals_field branch', () => {
          const primary = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/a'),
          };
          const canonical = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('/a'),
          };
          const container = {
            querySelector: jasmine.createSpy('querySelector').and.callFake((selector) => (
              selector === 'a.primary' ? primary : canonical
            )),
          };
          const matcher = new ConditionMatcher({
            selector: 'a.primary',
            attribute: 'href',
            equals: '/never',
            equals_field: { selector: 'a.canonical', attribute: 'href' },
          });

          expect(matcher.matches(container)).toBe(true);
        });
      });
    });

    describe('when equals_field is null', () => {
      it('falls through to the literal equals comparison', () => {
        const container = { text: '  books  ' };
        const matcher = new ConditionMatcher({ equals: 'books', equals_field: null });

        expect(matcher.matches(container)).toBe(true);
      });
    });
  });
});
