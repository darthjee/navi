# Code Organization

## Adding a New Job Class

Whenever a new job class is added to the backend (`source/lib/jobs/`), the frontend constant file **must also be updated**:

- `frontend/src/constants/jobClasses.js` — add the new class name to the `JOB_CLASSES` array.

This file is the single source of truth for the job-class filter dropdown in the UI. Omitting this step will cause the new class to be invisible in the filter.

## File Responsibility: Class Declarers vs Scripts

Every source file (excluding test files) must act as a **class declarer** — it should define and export one or more classes or modules. Files must not act as **scripts** (i.e., they must not execute logic at import time or perform side effects directly).

The only exceptions are **entrypoints**:

| Application | Entrypoint |
|-------------|-----------|
| Main app (`source/`) | `source/bin/navi.js` |
| Dev app (`dev/app/`) | `dev/app/server.js` |

`dev/app/app.js` is the application module (exports the configured Express app) and is imported by both `server.js` and the test suite. It is not a script.

*Example:*
```js
// Good: class declarer — defines and exports a class
class Router {
  register(app) { ... }
}
export default Router;

// Bad: script — executes logic at module level
const router = Router();
router.get('/path', handler);
export default router;
```

Test files are exempt from this rule and may import modules and execute setup code freely.

## File Naming: CamelCase for Class Files

Files that define and export a class must use **CamelCase** naming, matching the class name exactly.

*Examples:*

- `Router.js` for `class Router`
- `Config.js` for `class Config`
- `RouteRegistrar.js` for `class RouteRegistrar`
- `DataNavigator.js` for `class DataNavigator`

This applies to both source files and their corresponding spec files:

- `Router.js` → spec: `Router_spec.js`
- `DataNavigator.js` → spec: `DataNavigator_spec.js`

Non-class files (e.g., utility modules that export functions) use lowercase or camelCase at the author's discretion.

## Method Order: Public Before Private

Within a class, **public methods must be declared before private methods**. Private methods (prefixed with `#`) serve as implementation helpers and should appear at the end of the class body.

*Example:*
```js
// Good: public methods first, private methods last
class Worker {
  run() {
    this.#prepare();
    this.#execute();
  }

  getStatus() { ... }

  #prepare() { ... }
  #execute() { ... }
}

// Bad: private methods mixed in with or before public methods
class Worker {
  #prepare() { ... }

  run() { ... }

  #execute() { ... }
}
```
