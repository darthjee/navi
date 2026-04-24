# Plan: Tests

All tests follow the patterns from `frontend/spec/`. Tests use JSDOM + Jasmine + `spyOn(globalThis, 'fetch')` to mock HTTP calls. JSX is transpiled via the `spec/support/loader.js` + `transform_hooks.js` pair (copy from `frontend/`).

## Support Files

Copy these three files verbatim from `frontend/spec/support/`:
- `spec/support/dom.js` — sets up a JSDOM `window` on `globalThis`
- `spec/support/loader.js` — registers the ESM transform hook
- `spec/support/transform_hooks.js` — esbuild transform for `.jsx` and CSS mocks

## Client Tests

### `spec/clients/CategoriesClient_spec.js`

```js
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
```

### `spec/clients/ItemsClient_spec.js`

```js
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
```

## Page Tests

All page specs follow this structure (shown for `CategoriesIndexPage`):

```js
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import * as CategoriesClient from '../../src/clients/CategoriesClient.js';
import CategoriesIndexPage from '../../src/pages/CategoriesIndexPage.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('CategoriesIndexPage', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  const render = async () => {
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(MemoryRouter, null, createElement(CategoriesIndexPage)));
    });
  };

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(CategoriesClient, 'fetchCategories').and.returnValue(new Promise(() => {}));
      await render();
    });

    it('shows a spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });
  });

  describe('when data loads successfully', () => {
    const categories = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Books' },
    ];

    beforeEach(async () => {
      spyOn(CategoriesClient, 'fetchCategories').and.returnValue(Promise.resolve(categories));
      await render();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders all category names', () => {
      const text = container.textContent;
      expect(text).toContain('Electronics');
      expect(text).toContain('Books');
    });

    it('renders links to each category', () => {
      const links = container.querySelectorAll('a');
      const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/categories/1');
      expect(hrefs).toContain('/categories/2');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(CategoriesClient, 'fetchCategories').and.returnValue(
        Promise.reject(new Error('HTTP 500'))
      );
      await render();
      await flushAsync();
    });

    it('shows an error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('displays the error message', () => {
      expect(container.textContent).toContain('HTTP 500');
    });
  });
});
```

## Page Test Scenarios Summary

| Spec file | Client spy | Loading | Success assertions | Error |
|-----------|-----------|---------|-------------------|-------|
| `IndexPage_spec.js` | — | spinner | renders welcome/index content | — |
| `CategoriesIndexPage_spec.js` | `fetchCategories` | spinner | lists category names + links to `/categories/:id` | alert-danger |
| `CategoryPage_spec.js` | `fetchCategory` (with `useParams` id=1) | spinner | shows category name + link to `/categories/1/items` | alert-danger |
| `CategoryItemsIndexPage_spec.js` | `fetchItems` | spinner | lists item names + links to `/categories/:id/items/:id` | alert-danger |
| `CategoryItemPage_spec.js` | `fetchItem` | spinner | shows item name and details | alert-danger |

> Pages that use `useParams` must be rendered inside `<MemoryRouter initialEntries={['/categories/1']}>` so the param is available.
