# Backend and Frontend harness sections

Add the two "how do the specs actually load and exercise extension code" sections
to `docs/agents/future/downstream-extension-tests.md`. Each ends on one concrete
recommendation and shows the run command.

## Backend harness section

- **Loading extension modules** — an extension backend spec `import`s its target
  module directly by relative path from `src/backend/` (e.g.
  `import routes from '../../src/backend/orders.js'`), reads the exported
  `{ method, path, handler }` descriptors, and instantiates `handler` per the
  contract (`new handler(req, res)`), exactly as
  `source/spec/lib/server/handlers/LinksHandler_spec.js` does with a hand-rolled
  `res = { json: jasmine.createSpy('json') }` and, where a handler takes extras,
  `new HandlerConfig(Handler, [..]).handle({}, res)`.
- **`navi-hey/extension` resolution in tests** — the module under test does
  `import { RequestHandler } from 'navi-hey/extension'`; for that to resolve when
  the file is imported from the mounted folder, the dedicated image carries the
  same `/navi/node_modules/navi-hey` symlink SPEC-5 §1 specifies for the runtime
  container (recommend: the test image adds it too, so `src/backend/*.js` resolves
  identically under test and in production).
- **Navi test doubles available to backend specs** — the promoted subset of
  `source/spec/support/{factories,dummies,utils}` (finalised in step 04), reachable
  via a stable import specifier (candidate `navi-hey/testing`, decided in step 04).
  Recommend a minimal, documented set (request/response doubles, a `Logger`
  silencer) rather than exposing the whole tree.
- **Run command** — `npx jasmine` with the baked backend `jasmine.json`
  (`spec_dir` = mounted `tests/backend`). In the dedicated image this is the
  default `CMD` (or its `backend` subcommand — step 03).
- **Concrete recommendation** — backend specs are plain Jasmine, no jsdom, no
  loader; they import from `src/backend/`, fake `req`/`res` with
  `jasmine.createSpy`, and rely only on what `RouteRegister` guarantees
  (sync `GET` `handle()`, awaited `PATCH`/`POST`, the `ConflictError`/…→status
  mapping).

## Frontend harness section

- **Reused support files** — the image bakes `frontend/spec/support/`'s
  `loader.js`, `transform_hooks.js`, `dom.js`, and `fetch.js` at a stable path and
  wires a baked frontend `jasmine.json` with `helpers: ["support/dom.js"]`, run as
  `node --import <path>/loader.js node_modules/.bin/jasmine` — identical mechanics
  to `frontend/package.json`'s `spec` script.
- **What a frontend extension spec looks like** — model it on
  `frontend/spec/components/StatsHeader_spec.js`:
  `import descriptors from '../../src/frontend/entry.js'` (or the page `.jsx`
  directly), `const state = useContainer()` at `describe` level, render
  `state.root.render(createElement(MemoryRouter, null, createElement(Page)))`
  inside `await act(...)`, mock the API with `spyOn(globalThis, 'fetch')` or the
  `mockFetchSuccess` / `mockFetchFailure` helpers from `support/fetch.js`, assert
  on `state.container`.
- **React single-instance note** — under test there is no host import map; the
  spec resolves `react` / `react-router-dom` from the **image's** baked
  `node_modules` (frontend package deps), so `useContainer`'s `createRoot` and the
  extension component share one React. Recommend the image pin the same
  React / React-Router major/minor the published SPA ships (restated from SPEC-4 §
  "Single React instance" / SPEC-5 §8.1) and that the author's devDependencies
  match the image tag.
- **`.jsx` / CSS** — handled by `transform_hooks.js` (esbuild `jsx: 'automatic'`;
  CSS/SCSS imports stubbed to `export default {}`), so extension pages that
  `import './OrdersPage.css'` load under test unchanged.
- **Run command** — `node --import <path>/loader.js node_modules/.bin/jasmine`
  with the baked frontend `jasmine.json` (`spec_dir` = mounted `tests/frontend`);
  the image's `frontend` subcommand.
- **Concrete recommendation** — reuse `support/{loader,transform_hooks,dom,fetch}`
  **as-is** (documented subset, no fork); the author writes specs in the exact
  `useContainer` + `spyOn(fetch)` style used across `frontend/spec/components/`.

## Files to Change

- `docs/agents/future/downstream-extension-tests.md` — add the **Backend harness**
  and **Frontend harness** sections.
