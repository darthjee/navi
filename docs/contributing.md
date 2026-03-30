# Contributing

## Commit Guidelines

- **Atomic and Unitary:** Each commit must represent a single logical change.  
  *Example:*  
  - Good: `Add needsParams() method to ResourceRequest`  
  - Bad: `Add needsParams() and refactor Registry logic`
- **No Unrelated Changes:** Do not mix unrelated changes in the same commit.
- **Separate Refactoring:** Whenever possible, separate refactoring commits from new feature or bugfix commits.

## Pull Requests

- **Descriptive Summary:** Every PR must include a clear and descriptive summary of its purpose and changes.
- **PR Description Files:** If a description cannot be provided directly in the PR, generate a file with the PR description (e.g., `docs/issues/<pr_number>_description.md`), but do not commit this file.

## Definition of Done for PRs

A PR is considered complete when:

- The stated objective has been achieved.
- All tests are passing.
- Linting passes without errors.
- Code coverage is as high as reasonably possible.
- Code is not overly complex:
  - Classes and methods should have clear, focused responsibilities.
  - If a class or method is taking on too many responsibilities, refactor to simplify.
  - *Example (pseudo-code):*
    ```js
    // Good: Each method does one thing
    class Worker {
      fetchJob() { ... }
      processJob(job) { ... }
    }

    // Bad: Method does too much
    class Worker {
      run() {
        this.fetchJob();
        this.processJob();
        this.sendMetrics();
        this.cleanup();
      }
    }
    ```
  - This requirement applies primarily to source code. For specs, refactor only if there is excessive duplication.

## Code Organization

### File Responsibility: Class Declarers vs Scripts

Every source file (excluding test files) must act as a **class declarer** — it should define and export one or more classes or modules. Files must not act as **scripts** (i.e., they must not execute logic at import time or perform side effects directly).

The only exceptions are **entrypoints**:

| Application | Entrypoint |
|-------------|-----------|
| Main app (`source/`) | `source/bin/navi.js` |
| Dev app (`new-dev/`) | `new-dev/server.js` |

`new-dev/app.js` is the application module (exports the configured Express app) and is imported by both `server.js` and the test suite. It is not a script.

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

### File Naming: CamelCase for Class Files

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

## Refactoring Guidelines

When refactoring, aim to:

- **Reduce Code Duplication:**  
  *Example:* Move repeated setup code in specs to a factory function.
  ```js
  // Good
  function buildCategory(attrs = {}) {
    return { id: 1, name: 'Books', ...attrs };
  }
  // In tests:
  const category = buildCategory({ id: 2 });

  // Bad
  const category = { id: 2, name: 'Books' };
  // ...repeated in many files