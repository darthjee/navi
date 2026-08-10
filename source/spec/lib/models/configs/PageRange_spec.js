import { PageRange } from '../../../../lib/models/configs/PageRange.js';

const collect = (range) => {
  const pages = [];
  range.each((page) => pages.push(page));
  return pages;
};

describe('PageRange', () => {
  describe('#each', () => {
    it('iterates 1-based pages by default', () => {
      const range = new PageRange({ count: 3 });
      expect(collect(range)).toEqual([1, 2, 3]);
    });

    it('iterates 0-based pages when zeroIndexed is true', () => {
      const range = new PageRange({ count: 3, zeroIndexed: true });
      expect(collect(range)).toEqual([0, 1, 2]);
    });

    it('caps iteration to maxPage when maxPage is below count', () => {
      const range = new PageRange({ count: 10, maxPage: 2 });
      expect(collect(range)).toEqual([1, 2]);
    });

    it('caps iteration to maxPage when maxPage is below count and zeroIndexed is true', () => {
      const range = new PageRange({ count: 10, zeroIndexed: true, maxPage: 2 });
      expect(collect(range)).toEqual([0, 1]);
    });

    it('is a no-op cap when maxPage is greater than or equal to count', () => {
      const range = new PageRange({ count: 2, maxPage: 10 });
      expect(collect(range)).toEqual([1, 2]);
    });

    it('is unlimited when maxPage is null', () => {
      const range = new PageRange({ count: 3, maxPage: null });
      expect(collect(range)).toEqual([1, 2, 3]);
    });

    it('is unlimited when maxPage is omitted', () => {
      const range = new PageRange({ count: 3 });
      expect(collect(range)).toEqual([1, 2, 3]);
    });

    it('calls the callback zero times when count is 0', () => {
      const callback = jasmine.createSpy('callback');
      new PageRange({ count: 0 }).each(callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
