import { fetchItem, fetchItems } from '../../src/clients/ItemsClient.js';

describe('ItemsClient', () => {
  describe('fetchItems', () => {
    describe('when the request succeeds', () => {
      const data = [{ id: 1, name: 'Laptop' }];

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
        );
      });

      it('fetches from /categories/:categoryId/items.json', async () => {
        await fetchItems(1);
        expect(globalThis.fetch).toHaveBeenCalledWith('/categories/1/items.json');
      });

      it('returns the items array', async () => {
        const result = await fetchItems(1);
        expect(result).toEqual(data);
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 404 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(fetchItems(999)).toBeRejectedWithError('HTTP 404');
      });
    });
  });

  describe('fetchItem', () => {
    describe('when the request succeeds', () => {
      const data = { id: 1, name: 'Laptop', price: 999 };

      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
        );
      });

      it('fetches from /categories/:categoryId/items/:id.json', async () => {
        await fetchItem(1, 1);
        expect(globalThis.fetch).toHaveBeenCalledWith('/categories/1/items/1.json');
      });

      it('returns the item', async () => {
        const result = await fetchItem(1, 1);
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
        await expectAsync(fetchItem(1, 999)).toBeRejectedWithError('HTTP 404');
      });
    });
  });
});
