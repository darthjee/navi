import { ConditionMatcher } from '../../../../lib/parsers/css_selector_parser/ConditionMatcher.js';
import { ConditionMatcherUtils } from '../../../support/utils/ConditionMatcherUtils.js';

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
      const hrefCondition = {
        selector: 'a.primary',
        attribute: 'href',
        equals_field: { selector: 'a.canonical', attribute: 'href' },
      };

      const scenarios = [
        {
          description: 'and both sides resolve to the same value',
          example: 'returns true',
          config: hrefCondition,
          elements: { primary: { attribute: '/product/1' }, canonical: { attribute: '/product/1' } },
          expected: true,
        },
        {
          description: 'and the two sides resolve to different values',
          example: 'returns false',
          config: hrefCondition,
          elements: { primary: { attribute: '/product/1' }, canonical: { attribute: '/product/2' } },
          expected: false,
        },
        {
          description: 'and both sides resolve to null',
          example: 'returns true',
          config: hrefCondition,
          elements: { primary: null, canonical: null },
          expected: true,
        },
        {
          description: 'and one side resolves to null and the other to a string',
          example: 'returns false',
          config: hrefCondition,
          elements: { primary: { attribute: '/product/1' }, canonical: null },
          expected: false,
        },
        {
          description: 'and the right side sets trim to false',
          example: 'trims each side independently',
          config: { selector: 'a.primary', equals_field: { selector: 'a.canonical', trim: false } },
          elements: { primary: { text: '  sku-1  ' }, canonical: { text: '  sku-1  ' } },
          expected: false,
        },
        {
          description: 'and the right side reads text content while the left reads an attribute',
          example: 'compares the two independent resolutions',
          config: {
            selector: 'a.primary',
            attribute: 'data-category',
            equals_field: { selector: 'span.category' },
          },
          elements: { primary: { attribute: 'books' }, canonical: { text: 'books' } },
          expected: true,
        },
        {
          description: 'and the right side omits selector',
          example: 'resolves the container itself',
          config: { selector: 'a.primary', equals_field: {} },
          elements: { primary: { text: 'books' }, canonical: null },
          container: { text: 'books' },
          expected: true,
        },
        {
          description: 'and equals is also present',
          example: 'takes the equals_field branch',
          config: { ...hrefCondition, equals: '/never' },
          elements: { primary: { attribute: '/a' }, canonical: { attribute: '/a' } },
          expected: true,
        },
      ];

      scenarios.forEach(({ description, example, config, elements, container, expected }) => {
        describe(description, () => {
          it(example, () => {
            const stub = ConditionMatcherUtils.container(elements, container);

            expect(new ConditionMatcher(config).matches(stub)).toBe(expected);
          });
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
