import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { PathSegmentTraverser } from '../../../lib/models/PathSegmentTraverser.js';

describe('PathSegmentTraverser', () => {
  describe('#traverse', () => {
    describe('when traversing valid segments', () => {
      const obj = {
        parsedBody: { id: 1, nested: { key: 'val' } },
        headers: { page: '3' },
      };

      it('advances one level', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsedBody');
        traverser.traverse('parsedBody');
        expect(traverser.value).toEqual({ id: 1, nested: { key: 'val' } });
      });

      it('advances multiple levels', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsedBody.nested.key');
        traverser.traverse('parsedBody');
        traverser.traverse('nested');
        traverser.traverse('key');
        expect(traverser.value).toBe('val');
      });
    });

    describe('when current value is not an object', () => {
      const obj = { parsedBody: { id: 1 } };

      it('throws MissingMappingVariable', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsedBody.id.nested');
        traverser.traverse('parsedBody');
        traverser.traverse('id');
        expect(() => traverser.traverse('nested')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsedBody.id.nested'
        );
      });
    });

    describe('when current value is null', () => {
      const obj = { parsedBody: null };

      it('throws MissingMappingVariable', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsedBody.id');
        traverser.traverse('parsedBody');
        expect(() => traverser.traverse('id')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsedBody.id'
        );
      });
    });

    describe('when the segment key does not exist', () => {
      const obj = { parsedBody: { id: 1 }, headers: {} };

      it('throws MissingMappingVariable for a missing body field', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsedBody.missing');
        traverser.traverse('parsedBody');
        expect(() => traverser.traverse('missing')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsedBody.missing'
        );
      });

      it('throws MissingMappingVariable for a missing header', () => {
        const traverser = new PathSegmentTraverser(obj, "headers['absent']");
        traverser.traverse('headers');
        expect(() => traverser.traverse('absent')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === "headers['absent']"
        );
      });
    });
  });

  describe('#value', () => {
    it('returns the root before any traversal', () => {
      const obj = { id: 1 };
      const traverser = new PathSegmentTraverser(obj, 'id');
      expect(traverser.value).toEqual({ id: 1 });
    });
  });
});
