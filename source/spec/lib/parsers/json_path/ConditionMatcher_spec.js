import { ConditionMatcher } from '../../../../lib/parsers/json_path/ConditionMatcher.js';

describe('ConditionMatcher', () => {
  describe('#matches', () => {
    describe('when condition has equals', () => {
      describe('when the field value equals the literal', () => {
        it('returns true', () => {
          const matcher = new ConditionMatcher({ field: 'obj_type', equals: 'miniature' });
          const item = { obj_type: 'miniature' };

          expect(matcher.matches(item)).toBe(true);
        });
      });

      describe('when the field value does not equal the literal', () => {
        it('returns false', () => {
          const matcher = new ConditionMatcher({ field: 'obj_type', equals: 'miniature' });
          const item = { obj_type: 'accessory' };

          expect(matcher.matches(item)).toBe(false);
        });
      });
    });

    describe('when condition has equals_field', () => {
      describe('when both fields are equal', () => {
        it('returns true', () => {
          const matcher = new ConditionMatcher({ field: 'bnd_inid', equals_field: 'bundle_inid' });
          const item = { bnd_inid: 5, bundle_inid: 5 };

          expect(matcher.matches(item)).toBe(true);
        });
      });

      describe('when the fields differ', () => {
        it('returns false', () => {
          const matcher = new ConditionMatcher({ field: 'bnd_inid', equals_field: 'bundle_inid' });
          const item = { bnd_inid: 5, bundle_inid: 6 };

          expect(matcher.matches(item)).toBe(false);
        });
      });
    });
  });
});
