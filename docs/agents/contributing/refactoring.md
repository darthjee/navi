# Refactoring Guidelines

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
  ```
