# `src/main.jsx` async bootstrap + router wiring

Turn `main.jsx` into a thin async bootstrap that resolves the extension
descriptors **before** the single `createRoot(...).render(...)`, then merges the
extension `<Route>`s after the stock routes, nested inside `Layout` and wrapped in
`ExtensionErrorBoundary`.

## Shape

```jsx
import { loadExtensions } from './extensions/loadExtensions.js';
import ExtensionErrorBoundary from './extensions/ExtensionErrorBoundary.jsx';
// ...existing imports...

async function bootstrap() {
  const extensionRoutes = await loadExtensions(); // never throws; [] on any failure

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/logs" replace />} />
            {/* ...all existing stock routes, unchanged... */}
            <Route element={<ExtensionErrorBoundary />}>
              {extensionRoutes.map(({ path, component: C }) => (
                <Route key={path} path={path.replace(/^\//, '')} element={<C />} />
              ))}
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </StrictMode>,
  );
}

bootstrap();
```

- When `extensionRoutes` is `[]`, the rendered tree is **identical to today's**
  (the empty `.map()` and the wrapper `<Route element>` add no DOM). Confirm the
  `ExtensionErrorBoundary` layout route with zero children does not affect
  matching of stock routes — if it can, only render the wrapper `<Route>` when
  `extensionRoutes.length > 0`.
- Extension `path` values are `/`-prefixed (contract #3); strip the leading `/`
  for the nested `<Route path>` since it sits under `path="/"`.
- Keep `bootstrap()` fire-and-forget; do not convert the module to top-level
  `await` (keep the existing bundling behaviour predictable).

## Files to Change

- `frontend/src/main.jsx` — wrap the render in `async function bootstrap()`,
  `await loadExtensions()`, add the `ExtensionErrorBoundary` layout route with the
  mapped extension `<Route>`s after the stock routes.
