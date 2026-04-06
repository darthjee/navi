/**
 * Unit tests for SortedArraySearcher.
 * Uses Jasmine.
 */
import { SortedArraySearcher } from '../../lib/utils/SortedArraySearcher.js';

describe('SortedArraySearcher', () => {
  const sortBy = (obj) => obj.value;
  const array = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];

  describe('#search in "after" mode', () => {
    it('returns index of first element strictly greater than value', () => {
      expect(new SortedArraySearcher(array, sortBy).search(2, 'after')).toEqual(2);
    });

    it('returns 0 when all elements are greater', () => {
      expect(new SortedArraySearcher(array, sortBy).search(0, 'after')).toEqual(0);
    });

    it('returns array length when no element is greater', () => {
      expect(new SortedArraySearcher(array, sortBy).search(4, 'after')).toEqual(4);
    });
  });

  describe('#search in "from" mode', () => {
    it('returns index of first element >= value', () => {
      expect(new SortedArraySearcher(array, sortBy).search(2, 'from')).toEqual(1);
    });

    it('returns 0 when all elements qualify', () => {
      expect(new SortedArraySearcher(array, sortBy).search(1, 'from')).toEqual(0);
    });

    it('returns array length when no element qualifies', () => {
      expect(new SortedArraySearcher(array, sortBy).search(5, 'from')).toEqual(4);
    });
  });

  describe('#search in "before" mode', () => {
    it('returns index of first element >= value (exclusive upper bound)', () => {
      expect(new SortedArraySearcher(array, sortBy).search(3, 'before')).toEqual(2);
    });

    it('returns 0 when no element is less than value', () => {
      expect(new SortedArraySearcher(array, sortBy).search(1, 'before')).toEqual(0);
    });

    it('returns array length when all elements are less than value', () => {
      expect(new SortedArraySearcher(array, sortBy).search(5, 'before')).toEqual(4);
    });
  });

  describe('#search in "upTo" mode', () => {
    it('returns index of first element strictly greater than value (exclusive upper bound)', () => {
      expect(new SortedArraySearcher(array, sortBy).search(3, 'upTo')).toEqual(3);
    });

    it('returns 0 when no element is <= value', () => {
      expect(new SortedArraySearcher(array, sortBy).search(0, 'upTo')).toEqual(0);
    });

    it('returns array length when all elements are <= value', () => {
      expect(new SortedArraySearcher(array, sortBy).search(4, 'upTo')).toEqual(4);
    });
  });

  describe('with empty array', () => {
    it('returns 0 for any mode and value', () => {
      const searcher = new SortedArraySearcher([], sortBy);
      expect(searcher.search(5, 'after')).toEqual(0);
      expect(searcher.search(5, 'from')).toEqual(0);
      expect(searcher.search(5, 'before')).toEqual(0);
      expect(searcher.search(5, 'upTo')).toEqual(0);
    });
  });
});
