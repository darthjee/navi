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
    return this.#builderFunction()(...attributes);
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
    return args;
  }
}

export { Factory };