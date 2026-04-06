/**
 * Unit tests for SortedArrayMerger.
 * Uses Jasmine.
 */
import { SortedArrayMerger } from '../../lib/utils/SortedArrayMerger.js';

describe('SortedArrayMerger', () => {
  const sortBy = (obj) => obj.value;

  describe('#merge', () => {
    it('merges two sorted arrays into a single sorted array', () => {
      const first = [{ value: 1 }, { value: 3 }, { value: 5 }];
      const second = [{ value: 2 }, { value: 4 }, { value: 6 }];
      const result = new SortedArrayMerger(first, second, sortBy).merge();
      expect(result.map(e => e.value)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('handles empty first array', () => {
      const second = [{ value: 1 }, { value: 2 }];
      const result = new SortedArrayMerger([], second, sortBy).merge();
      expect(result.map(e => e.value)).toEqual([1, 2]);
    });

    it('handles empty second array', () => {
      const first = [{ value: 1 }, { value: 2 }];
      const result = new SortedArrayMerger(first, [], sortBy).merge();
      expect(result.map(e => e.value)).toEqual([1, 2]);
    });

    it('handles both arrays empty', () => {
      const result = new SortedArrayMerger([], [], sortBy).merge();
      expect(result).toEqual([]);
    });

    it('handles duplicate sort values across arrays', () => {
      const first = [{ value: 1 }, { value: 2 }];
      const second = [{ value: 2 }, { value: 3 }];
      const result = new SortedArrayMerger(first, second, sortBy).merge();
      expect(result.map(e => e.value)).toEqual([1, 2, 2, 3]);
    });

    it('preserves first-array elements before second on equal values (stable)', () => {
      const a = { value: 2, source: 'first' };
      const b = { value: 2, source: 'second' };
      const result = new SortedArrayMerger([a], [b], sortBy).merge();
      expect(result[0].source).toEqual('first');
      expect(result[1].source).toEqual('second');
    });

    it('handles arrays of different lengths', () => {
      const first = [{ value: 1 }];
      const second = [{ value: 2 }, { value: 3 }, { value: 4 }];
      const result = new SortedArrayMerger(first, second, sortBy).merge();
      expect(result.map(e => e.value)).toEqual([1, 2, 3, 4]);
    });
  });
});
