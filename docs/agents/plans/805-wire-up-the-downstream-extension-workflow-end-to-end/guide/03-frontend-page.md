# Frontend page (`src/frontend/`)

The React page + its entry descriptor, bundled by `vite build --lib` into
`dist/frontend/orders.js` (+ `orders.css`).

## What to do

`src/frontend/OrdersPage.jsx` — matches `extending-navi.md` › Worked example:

```jsx
import { useEffect, useState } from 'react';
import './OrdersPage.css';

export default function OrdersPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/ext/orders/summary.json')
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary({ error: true }));
  }, []);

  if (!summary) return <p className="orders-loading">Loading…</p>;
  if (summary.error) return <p className="orders-error">Unavailable</p>;
  return <p className="orders-summary">{summary.pending} pending order(s)</p>;
}
```

`src/frontend/OrdersPage.css`:

```css
.orders-summary { font-weight: 600; }
.orders-error   { color: var(--bs-danger, #dc3545); }
```

`src/frontend/entry.js`:

```js
import OrdersPage from './OrdersPage.jsx';

export default [
  { path: '/ext/orders', text: 'Orders', component: OrdersPage },
];
```

- `import` React bare — it is externalised by the lib build and resolves via the
  host importmap at runtime.
- After `npm run build`, confirm `dist/frontend/orders.js` is a single ESM file
  that does **not** inline React, and `dist/frontend/orders.css` is emitted
  alongside it (sibling-CSS convention the loader relies on).

## Files to Change

- `examples/navi-orders-extension/src/frontend/OrdersPage.jsx` — new.
- `examples/navi-orders-extension/src/frontend/OrdersPage.css` — new.
- `examples/navi-orders-extension/src/frontend/entry.js` — new.
