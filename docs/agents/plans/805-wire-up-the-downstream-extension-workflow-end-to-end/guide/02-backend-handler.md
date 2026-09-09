# Backend handler (`src/backend/orders.js`)

The plain-ESM backend module, copied verbatim into `dist/backend/orders.js` by
the build script (no transform).

## What to do

`src/backend/orders.js`, matching `extending-navi.md` › Worked example exactly:

```js
import { RequestHandler } from 'navi-hey/extension';

class OrdersSummaryHandler extends RequestHandler {
  constructor(_request, response) {
    super();
    this.response = response;
  }

  handle() {
    this.response.json({ pending: 3, service: 'orders-extension' });
  }
}

export default [
  { method: 'GET', path: '/ext/orders/summary.json', handler: OrdersSummaryHandler },
];
```

- Import specifier is `navi-hey/extension` **verbatim** — it resolves in the dev
  container via the symlink the `docker` agent is adding to
  `dockerfiles/dev_navi_hey/Dockerfile`, and in prod via the existing
  `/navi/node_modules/navi-hey` symlink + `source/package.json` `exports`.
- `GET` `handle()` runs synchronously; it owns the response (`res.json(...)`).
- No npm dependencies beyond what the Navi image ships.

## Files to Change

- `examples/navi-orders-extension/src/backend/orders.js` — new.
