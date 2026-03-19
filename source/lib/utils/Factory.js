class Factory {
  #builder;
  #klass;

  constructor({ builder = null, klass = null } = {}) {
    this.#builder = builder;
    this.#klass = klass;
  }

  build(...args) {
    return this.#builderFunction()(...args);
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
}

export { Factory };