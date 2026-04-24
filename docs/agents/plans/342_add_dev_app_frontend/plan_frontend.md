# Plan: Frontend Application

## Directory Structure

```
dev/frontend/
  src/
    main.jsx                    # entry point — mounts <App /> with React Router
    App.jsx                     # top-level router (<Routes> + <Route> definitions)
    clients/
      CategoriesClient.js       # fetchCategories(), fetchCategory(id)
      ItemsClient.js            # fetchItems(categoryId), fetchItem(categoryId, id)
    pages/
      IndexPage.jsx
      CategoriesIndexPage.jsx
      CategoryPage.jsx
      CategoryItemsIndexPage.jsx
      CategoryItemPage.jsx
    styles/
      main.css                  # @import 'bootstrap/dist/css/bootstrap.min.css'
  spec/
    support/
      dom.js                    # JSDOM setup (copy from frontend/spec/support/dom.js)
      loader.js                 # ESM + JSX loader (copy from frontend/spec/support/loader.js)
      transform_hooks.js        # esbuild transform for .jsx (copy from frontend/)
    clients/
      CategoriesClient_spec.js
      ItemsClient_spec.js
    pages/
      IndexPage_spec.js
      CategoriesIndexPage_spec.js
      CategoryPage_spec.js
      CategoryItemsIndexPage_spec.js
      CategoryItemPage_spec.js
  package.json
  vite.config.js
  eslint.config.mjs
  index.html
```

## `package.json`

Based on `frontend/package.json`. Key differences:
- `name`: `"navi-dev-frontend"`
- No `@tanstack/react-query` or `date-fns` (not needed)
- Add `react-router-dom` for client-side routing

```json
{
  "name": "navi-dev-frontend",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "build": "vite build",
    "server": "vite dev --host 0.0.0.0 --port 8080",
    "test": "NODE_OPTIONS='--import ./spec/support/loader.js' npx c8 jasmine spec/**/*.js",
    "coverage": "NODE_OPTIONS='--import ./spec/support/loader.js' npx c8 --reporter=lcov jasmine spec/**/*.js",
    "lint": "eslint .",
    "lint_fix": "eslint . --fix",
    "report": "jscpd src/ --reporters html,console --output ./report"
  },
  "dependencies": {
    "bootstrap": "^5.3.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "@vitejs/plugin-react": "^5.1.1",
    "c8": "11.0.0",
    "eslint": "^9.39.1",
    "eslint-plugin-import": "^2.26.0",
    "eslint-plugin-jasmine": "^4.1.3",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.0.1",
    "globals": "^16.5.0",
    "jasmine": "^5.0.0",
    "jsdom": "^25.0.0",
    "vite": "^7.2.4"
  },
  "jasmine": {
    "spec_dir": "spec",
    "spec_files": ["**/*[sS]pec.js"],
    "helpers": ["support/dom.js"]
  },
  "c8": {
    "reporter": ["text", "html"],
    "extension": [".js", ".jsx"],
    "include": ["src/**/*.js", "src/**/*.jsx"],
    "exclude": ["spec/**", "coverage/**", "report/**"],
    "all": true,
    "check-coverage": false
  }
}
```

## `main.jsx`

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

## `App.jsx`

```jsx
import { Route, Routes } from 'react-router-dom';
import CategoryItemPage from './pages/CategoryItemPage.jsx';
import CategoryItemsIndexPage from './pages/CategoryItemsIndexPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import CategoriesIndexPage from './pages/CategoriesIndexPage.jsx';
import IndexPage from './pages/IndexPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/categories" element={<CategoriesIndexPage />} />
      <Route path="/categories/:id" element={<CategoryPage />} />
      <Route path="/categories/:id/items" element={<CategoryItemsIndexPage />} />
      <Route path="/categories/:category_id/items/:id" element={<CategoryItemPage />} />
    </Routes>
  );
}

export default App;
```

## Clients

### `src/clients/CategoriesClient.js`

```js
const fetchCategories = () =>
  fetch('/categories.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

const fetchCategory = (id) =>
  fetch(`/categories/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

export { fetchCategories, fetchCategory };
```

### `src/clients/ItemsClient.js`

```js
const fetchItems = (categoryId) =>
  fetch(`/categories/${categoryId}/items.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

const fetchItem = (categoryId, id) =>
  fetch(`/categories/${categoryId}/items/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

export { fetchItem, fetchItems };
```

## Pages

Each page follows the same loading/error/data pattern:

```jsx
import { useEffect, useState } from 'react';
import { fetchCategories } from '../clients/CategoriesClient.js';

function CategoriesIndexPage() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-border" role="status" />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <ul>
      {categories.map((cat) => (
        <li key={cat.id}><a href={`/categories/${cat.id}`}>{cat.name}</a></li>
      ))}
    </ul>
  );
}

export default CategoriesIndexPage;
```

Pages that depend on URL params use `useParams()` from `react-router-dom`:

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCategory } from '../clients/CategoriesClient.js';

function CategoryPage() {
  const { id } = useParams();
  // ...same loading pattern...
}
```

## `vite.config.js`

Copy from `frontend/vite.config.js` (same config, same port 8080).

## `eslint.config.mjs`

Copy from `frontend/eslint.config.mjs` (identical setup — React + JSX + Jasmine).
