# Scaffold the example package + build config

Create the `examples/navi-orders-extension/` standalone package — the SPEC-5 §7
worked example, structurally modelled on the `worker/` package (own
`package.json`, own toolchain, own spec config).

## What to do

- `package.json` — `name: "navi-orders-extension"`, `private: true`,
  `type: "module"`. Scripts:
  - `"build": "vite build && mkdir -p dist/backend && cp src/backend/*.js dist/backend/"`
  - `"test": "node --import ./spec/support/loader.js node_modules/.bin/jasmine --config=spec/support/jasmine.json"`
    (mirror `worker`'s `--config=` usage; the `--import` loader matches
    `frontend/`'s spec wiring).
  `devDependencies` (align majors with `frontend/package.json` — confirm exact
  strings with the `docs` agent, who is de-staling the guide's copy):
  `react` `^19.2.0`, `react-dom` `^19.2.0`, `react-router-dom` `7.14.2`,
  `vite` `^7.2.4`, `@vitejs/plugin-react` `^5.1.1`, `esbuild` `^0.28.0`,
  `jsdom` `^25.0.0`, `jasmine` `^5.0.0`, `c8` (match `frontend`).
- `.gitignore` — `dist/`, `node_modules/`, `coverage/`.
- `vite.config.js` — library build, from the `extending-navi.md` skeleton but
  with the **full six** externals:
  ```js
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    build: {
      lib: { entry: 'src/frontend/entry.js', formats: ['es'], fileName: () => 'orders.js' },
      outDir: 'dist/frontend',
      emptyOutDir: true,
      rollupOptions: {
        external: [
          'react', 'react-dom', 'react-dom/client',
          'react-router-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime',
        ],
      },
    },
  });
  ```
  Do **not** add `babel-plugin-react-compiler` (app-only in `frontend/`).
- `config/menu.yml`:
  ```yaml
  entries:
    - route: /ext/orders
      text: Orders
  ```
- `README.md` — short: what it demonstrates, `npm ci && npm run build`,
  `npm test`, the `docker compose up -d navi_extensions_app` pointer, and the
  one-line "npm (not Yarn) is intentional — this simulates a downstream consumer"
  note.
- Optionally a minimal `config/navi_config.yml` with `web.autostart: false` — add
  only if the `docker` agent finds the stock `navi_config.yml` destabilises the
  smoke run (see plan.md › Notes).

## Files to Change

- `examples/navi-orders-extension/package.json` — new.
- `examples/navi-orders-extension/.gitignore` — new.
- `examples/navi-orders-extension/vite.config.js` — new.
- `examples/navi-orders-extension/config/menu.yml` — new.
- `examples/navi-orders-extension/README.md` — new.
- `examples/navi-orders-extension/config/navi_config.yml` — new, only if needed.
