# Dependency Injection

Classes must receive their dependencies (data, configuration, collaborators) as constructor arguments. A class must never reach out to load files, read environment variables, or fetch configuration on its own.

**The entry script is the only place responsible for loading configuration** (e.g. reading a YAML file, parsing CLI arguments). It then passes the loaded data down to the classes that need it.

This makes every class independently testable: tests simply instantiate the class with the data they need, without touching the filesystem or environment.

*Example:*
```js
// Good: class receives data as an argument — easy to test
class Router {
  constructor(data) {
    this._data = data;
  }
  build() { ... }
}

// In server.js (entry script):
const data = load(readFileSync(dataPath, 'utf8'));
const router = new Router(data);

// Bad: class loads its own config — hard to test and couples to the filesystem
class Router {
  build() {
    const data = load(readFileSync('./data.yml', 'utf8')); // ❌
    ...
  }
}
```

This principle applies to all classes — including helpers and registrars. If a class needs data, it gets it through its constructor.
