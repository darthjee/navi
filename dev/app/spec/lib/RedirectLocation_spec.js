import RedirectLocation from '../../lib/RedirectLocation.js';

describe('RedirectLocation', () => {
  describe('#build — static target with no params', () => {
    it('returns the target unchanged', () => {
      const location = new RedirectLocation('/#/categories', {}).build();
      expect(location).toBe('/#/categories');
    });
  });

  describe('#build — target with one named segment', () => {
    it('substitutes the param into the target', () => {
      const location = new RedirectLocation('/#/categories/:id', { id: '5' }).build();
      expect(location).toBe('/#/categories/5');
    });

    it('URI-encodes the param value', () => {
      const location = new RedirectLocation('/#/categories/:id', { id: 'a b' }).build();
      expect(location).toBe('/#/categories/a%20b');
    });

    it('leaves the placeholder when the param is missing', () => {
      const location = new RedirectLocation('/#/categories/:id', {}).build();
      expect(location).toBe('/#/categories/:id');
    });
  });

  describe('#build — target with two named segments', () => {
    it('substitutes both params', () => {
      const location = new RedirectLocation(
        '/#/categories/:categoryId/items/:id',
        { categoryId: '3', id: '7' }
      ).build();
      expect(location).toBe('/#/categories/3/items/7');
    });
  });
});
