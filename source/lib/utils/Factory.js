/**
 * A flexible factory class that can be configured with a builder function, a class, and an attributes generator.
 * 
 * The factory can build objects using the provided builder or class,
 * and can generate attributes using the attributes generator.
 */
class Factory {
  #builder;
  #klass;
  #attributesGenerator;

  constructor({ builder = null, klass = null, attributesGenerator = null } = {}) {
    this.#builder = builder;
    this.#klass = klass;
    this.#attributesGenerator = attributesGenerator;
  }

  build(...args) {
    const attributes = this.#generateAttributes(...args);
    const builder = this.#builderFunction();
    return builder(...attributes);
  }

  #builderFunction() {
    if (typeof this.#builder !== 'function') {
      this.#builder = this.#defaultBuilder();
    }
    return this.#builder;
  }

  #defaultBuilder() {
    if (this.#klass) {
      return (...args) => new this.#klass(...args);
    }
    return () => ({});
  }

  #generateAttributes(...args) {
    if (this.#attributesGenerator) {
      return [this.#attributesGenerator.generate(...args)];
    }
    return args;
  }
}

export { Factory };