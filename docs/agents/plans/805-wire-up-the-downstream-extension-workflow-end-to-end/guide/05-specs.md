# Example specs (backend + frontend, Jasmine)

The two worked-example tests, in **Jasmine** form (SPEC-6 supersedes SPEC-5's
`node:test` / `vitest` snippets). They import the pre-build `src/` directly — no
build step runs before the specs.

## What to do

`tests/backend/orders_spec.js` — instantiate the handler with a fake `response`,
call `handle()`, assert on what it wrote:

```js
import routes from '../../src/backend/orders.js';

describe('orders backend extension', () => {
  it('declares GET /ext/orders/summary.json', () => {
    const [route] = routes;
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/ext/orders/summary.json');
  });

  it('writes a JSON summary', () => {
    let body;
    const response = { json: (payload) => { body = payload; } };
    new routes[0].handler({}, response).handle();
    expect(body.service).toBe('orders-extension');
    expect(typeof body.pending).toBe('number');
  });
});
```

`tests/frontend/orders_page_spec.jsx` — render the component via the `dom.js`
`useContainer()` helper, mock `fetch` via `fetch.js`, assert on output:

```jsx
import { useContainer } from '../../spec/support/dom.js';
import { mockFetchSuccess } from '../../spec/support/fetch.js';
import descriptors from '../../src/frontend/entry.js';

describe('OrdersPage', () => {
  const container = useContainer();
  mockFetchSuccess({ pending: 3, service: 'orders-extension' });

  it('exposes the /ext/orders descriptor', () => {
    expect(descriptors[0].path).toBe('/ext/orders');
    expect(descriptors[0].text).toBe('Orders');
  });

  it('renders the pending-order count', async () => {
    const OrdersPage = descriptors[0].component;
    await container.render(<OrdersPage />);
    expect(container.node.textContent).toContain('3 pending order(s)');
  });
});
```

Match the exact `useContainer()` API from the copied `dom.js` (method names may
differ — `render` / `.node` / `.root`); adjust the calls to whatever the copied
helper exposes. The behavioural asserts are the fixed part: descriptor shape and
the `"3 pending order(s)"` text.

## Files to Change

- `examples/navi-orders-extension/tests/backend/orders_spec.js` — new.
- `examples/navi-orders-extension/tests/frontend/orders_page_spec.jsx` — new.
