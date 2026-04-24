import { fetchCategories, fetchCategory } from '../../src/clients/CategoriesClient.js';

describe('CategoriesClient', () => {
  describe('fetchCategories', () => {
    describe('when the request succeeds', () => {
      const data = [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }];

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
        );
      });

      it('fetches from /categories.json', async () => {
        await fetchCategories();
        expect(globalThis.fetch).toHaveBeenCalledWith('/categories.json');
      });

      it('returns the categories array', async () => {
        const result = await fetchCategories();
        expect(result).toEqual(data);
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 500 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(fetchCategories()).toBeRejectedWithError('HTTP 500');
      });
    });
  });

  describe('fetchCategory', () => {
    describe('when the request succeeds', () => {
      const data = { id: 1, name: 'Electronics' };

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
        );
      });

      it('fetches from /categories/:id.json', async () => {
        await fetchCategory(1);
        expect(globalThis.fetch).toHaveBeenCalledWith('/categories/1.json');
      });

      it('returns the category', async () => {
        const result = await fetchCategory(1);
        expect(result).toEqual(data);
      });
    });

    describe('when the request fails with 404', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 404 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(fetchCategory(999)).toBeRejectedWithError('HTTP 404');
      });
    });
  });
});
