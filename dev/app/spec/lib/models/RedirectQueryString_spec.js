import RedirectQueryString from '../../../lib/models/RedirectQueryString.js';

describe('RedirectQueryString', () => {
  describe('#build — with regular params', () => {
    it('builds the expected query string', () => {
      const query = new RedirectQueryString({ search: 'hobbit', order: 'asc' }).build();
      expect(query).toBe('search=hobbit&order=asc');
    });
  });

  describe('#build — with repeated params', () => {
    it('preserves repeated values', () => {
      const query = new RedirectQueryString({ tag: ['books', 'fantasy'] }).build();
      expect(query).toBe('tag=books&tag=fantasy');
    });
  });

  describe('#build — with URL-like values', () => {
    it('filters protocol-relative values', () => {
      const query = new RedirectQueryString({
        redirect: '//evil.com',
        search: 'hobbit'
      }).build();
      expect(query).toBe('search=hobbit');
    });

    it('filters absolute URL values', () => {
      const query = new RedirectQueryString({
        redirect: 'https://evil.com',
        search: 'hobbit'
      }).build();
      expect(query).toBe('search=hobbit');
    });
  });
});
