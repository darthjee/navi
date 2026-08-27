import { FilterMatcher } from '../../../../lib/parsers/json_path/FilterMatcher.js';

describe('FilterMatcher', () => {
  describe('#matches', () => {
    describe('when filter is absent', () => {
      it('returns true', () => {
        const matcher = new FilterMatcher(undefined);
        const item = { obj_type: 'miniature' };

        expect(matcher.matches(item)).toBe(true);
      });
    });

    describe('when filter has a single passing condition', () => {
      it('returns true', () => {
        const matcher = new FilterMatcher([{ field: 'obj_type', equals: 'miniature' }]);
        const item = { obj_type: 'miniature' };

        expect(matcher.matches(item)).toBe(true);
      });
    });

    describe('when filter has a single failing condition', () => {
      it('returns false', () => {
        const matcher = new FilterMatcher([{ field: 'obj_type', equals: 'miniature' }]);
        const item = { obj_type: 'accessory' };

        expect(matcher.matches(item)).toBe(false);
      });
    });

    describe('when filter has multiple conditions', () => {
      describe('when every condition passes', () => {
        it('returns true', () => {
          const matcher = new FilterMatcher([
            { field: 'obj_type', equals: 'miniature' },
            { field: 'bnd_inid', equals_field: 'bundle_inid' },
          ]);
          const item = { obj_type: 'miniature', bnd_inid: 5, bundle_inid: 5 };

          expect(matcher.matches(item)).toBe(true);
        });
      });

      describe('when only one condition fails', () => {
        it('returns false', () => {
          const matcher = new FilterMatcher([
            { field: 'obj_type', equals: 'miniature' },
            { field: 'bnd_inid', equals_field: 'bundle_inid' },
          ]);
          const item = { obj_type: 'miniature', bnd_inid: 5, bundle_inid: 6 };

          expect(matcher.matches(item)).toBe(false);
        });
      });
    });
  });
});
