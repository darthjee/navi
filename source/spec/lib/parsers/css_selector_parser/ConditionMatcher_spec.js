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
  });
});
