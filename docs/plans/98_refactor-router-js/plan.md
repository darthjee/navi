# Plan: Refactor router.js (#98)

Issue: https://github.com/darthjee/navi/issues/98

## Context

`new-dev/lib/router.js` builds a `DataNavigator` steps array by hand for every route, and
repeats the same null-check + respond pattern in each handler. The goal is to extract that
logic into two dedicated classes so `Router#build` becomes a declarative list of route
registrations.

The `c8` config already includes `lib/**/*.js`, so no `package.json` change is needed.

---

## Step 1 — Create `new-dev/lib/route_params_extractor.js`

Converts a route pattern and an Express `req.params` hash into the steps array expected
by `DataNavigator`.

```js
class RouteParamsExtractor {
  constructor(routePattern, params) {
    this._routePattern = routePattern;
    this._params = params;
  }

  steps() {
    const path = this._routePattern.replace(/\.json$/, '');
    return path.split('/').filter(Boolean).map((segment) => {
      if (segment.startsWith(':')) {
        return Number(this._params[segment.slice(1)]);
      }
      return segment;
    });
  }
}

export default RouteParamsExtractor;
```

---

## Step 2 — Create `new-dev/spec/lib/route_params_extractor_spec.js`

```js
import RouteParamsExtractor from '../../lib/route_params_extractor.js';

describe('RouteParamsExtractor', () => {
  describe('#steps', () => {
    describe('with no named params', () => {
      it('returns the single string segment', () => {
        const extractor = new RouteParamsExtractor('/categories.json', {});
        expect(extractor.steps()).toEqual(['categories']);
      });
    });

    describe('with a single named param', () => {
      it('resolves the param as a Number', () => {
        const extractor = new RouteParamsExtractor('/categories/:id.json', { id: '3' });
        expect(extractor.steps()).toEqual(['categories', 3]);
      });
    });

    describe('with a static segment after a named param', () => {
      it('keeps the static segment as a string', () => {
        const extractor = new RouteParamsExtractor('/categories/:id/items.json', { id: '1' });
        expect(extractor.steps()).toEqual(['categories', 1, 'items']);
      });
    });

    describe('with multiple named params', () => {
      it('resolves all params as Numbers in order', () => {
        const extractor = new RouteParamsExtractor(
          '/categories/:id/items/:item_id.json',
          { id: '2', item_id: '5' }
        );
        expect(extractor.steps()).toEqual(['categories', 2, 'items', 5]);
      });
    });
  });
});
```

---

## Step 3 — Create `new-dev/lib/route_registrar.js`

Registers a GET route on an Express router using `RouteParamsExtractor` and
`DataNavigator`. An optional `serializer` function transforms the result before sending;
it defaults to the identity function so routes that need no shaping work out of the box.

```js
import DataNavigator from './data_navigator.js';
import RouteParamsExtractor from './route_params_extractor.js';
import { notFound } from './not_found.js';

class RouteRegistrar {
  constructor(router, data) {
    this._router = router;
    this._data = data;
  }

  register(route, serializer = (x) => x) {
    this._router.get(route, (req, res) => {
      const steps = new RouteParamsExtractor(route, req.params).steps();
      const result = new DataNavigator(this._data, steps).navigate();
      if (result === null) return notFound(res);
      res.json(serializer(result));
    });
  }
}

export default RouteRegistrar;
```

---

## Step 4 — Create `new-dev/spec/lib/route_registrar_spec.js`

```js
import express from 'express';
import request from 'supertest';
import { Router as ExpressRouter } from 'express';
import RouteRegistrar from '../../lib/route_registrar.js';
import { notFound } from '../../lib/not_found.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

const data = FixturesUtils.loadYamlFixture('data.yml');

const buildTestApp = (setup) => {
  const app = express();
  const router = ExpressRouter();
  setup(new RouteRegistrar(router, data));
  app.use(router);
  app.use((_req, res) => notFound(res));
  return app;
};

describe('RouteRegistrar', () => {
  describe('#register', () => {
    describe('for a route with no params', () => {
      const app = buildTestApp((r) => r.register('/categories.json'));

      it('returns 200 with the navigated result', async () => {
        const res = await request(app).get('/categories.json');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTrue();
      });
    });

    describe('for a route with a numeric param', () => {
      const app = buildTestApp((r) => r.register('/categories/:id.json'));

      it('returns 200 for a known id', async () => {
        const res = await request(app).get('/categories/1.json');
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(1);
      });

      it('returns 404 for an unknown id', async () => {
        const res = await request(app).get('/categories/999.json');
        expect(res.status).toBe(404);
      });
    });

    describe('with a serializer', () => {
      const app = buildTestApp((r) => {
        r.register('/categories.json', (cats) => cats.map(({ id, name }) => ({ id, name })));
      });

      it('applies the serializer before responding', async () => {
        const res = await request(app).get('/categories.json');
        expect(res.status).toBe(200);
        expect(res.body[0].items).toBeUndefined();
      });
    });
  });
});
```

---

## Step 5 — Refactor `new-dev/lib/router.js`

Replace all manual `DataNavigator` calls with `RouteRegistrar`. Routes that previously
shaped their response pass a serializer; the two items routes need none.

```js
import { Router as ExpressRouter } from 'express';
import RouteRegistrar from './route_registrar.js';

class Router {
  constructor(data) {
    this._data = data;
  }

  build() {
    const router = ExpressRouter();
    const registrar = new RouteRegistrar(router, this._data);

    registrar.register(
      '/categories.json',
      (categories) => categories.map(({ id, name }) => ({ id, name }))
    );
    registrar.register('/categories/:id.json', ({ id, name }) => ({ id, name }));
    registrar.register('/categories/:id/items.json');
    registrar.register('/categories/:id/items/:item_id.json');

    return router;
  }
}

export default Router;
```

The existing `router_spec.js` exercises all four routes and must continue to pass without
modification.

---

## Acceptance Criteria

- [ ] `new-dev/lib/route_params_extractor.js` exists and all four route patterns produce
  the correct steps array
- [ ] `new-dev/lib/route_registrar.js` exists and registers working GET handlers
- [ ] `router.js` contains no manual steps arrays and no direct `DataNavigator` import
- [ ] `new-dev/spec/lib/route_params_extractor_spec.js` passes
- [ ] `new-dev/spec/lib/route_registrar_spec.js` passes
- [ ] `new-dev/spec/lib/router_spec.js` continues to pass without modification
- [ ] `yarn test` inside `new-dev/` is green
