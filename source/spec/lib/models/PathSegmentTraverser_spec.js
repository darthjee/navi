import { MissingMappingVariable } from '../../../lib/exceptions/MissingMappingVariable.js';
import { PathSegmentTraverser } from '../../../lib/models/PathSegmentTraverser.js';

describe('PathSegmentTraverser', () => {
  describe('#traverse', () => {
    describe('when traversing valid segments', () => {
      const obj = {
        parsed_body: { id: 1, nested: { key: 'val' } },
        headers: { page: '3' },
      };

      it('advances one level', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsed_body');
        traverser.traverse('parsed_body');
        expect(traverser.value).toEqual({ id: 1, nested: { key: 'val' } });
      });

      it('advances multiple levels', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsed_body.nested.key');
        traverser.traverse('parsed_body');
        traverser.traverse('nested');
        traverser.traverse('key');
        expect(traverser.value).toBe('val');
      });
    });

    describe('when current value is not an object', () => {
      const obj = { parsed_body: { id: 1 } };

      it('throws MissingMappingVariable', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsed_body.id.nested');
        traverser.traverse('parsed_body');
        traverser.traverse('id');
        expect(() => traverser.traverse('nested')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.id.nested'
        );
      });
    });

    describe('when current value is null', () => {
      const obj = { parsed_body: null };

      it('throws MissingMappingVariable', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsed_body.id');
        traverser.traverse('parsed_body');
        expect(() => traverser.traverse('id')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.id'
        );
      });
    });

    describe('when the segment key does not exist', () => {
      const obj = { parsed_body: { id: 1 }, headers: {} };

      it('throws MissingMappingVariable for a missing body field', () => {
        const traverser = new PathSegmentTraverser(obj, 'parsed_body.missing');
        traverser.traverse('parsed_body');
        expect(() => traverser.traverse('missing')).toThrowMatching(
          (error) => error instanceof MissingMappingVariable
            && error.variable === 'parsed_body.missing'
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
