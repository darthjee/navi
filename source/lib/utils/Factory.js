/**
 * A flexible factory class that can be configured with a builder function, a class, and an attributes generator.
 *
 * The factory can build objects using the provided builder or class,
 * and can generate attributes using the attributes generator.
 * @author darthjee
 */
class Factory {
  #builder;
  #klass;
  #attributesGenerator;

  /**
   * Creates a new Factory instance.
   * @param {object} params - The parameters for configuring the factory.
   * @param {Function|null} params.builder - A function used to build objects. Takes generated attributes as arguments.
   * @param {Function|null} params.klass - A class used to instantiate objects when no builder is provided.
   * @param {object|null} params.attributesGenerator - An object with a `generate` method that produces attributes before building.
   */
  constructor({ builder = null, klass = null, attributesGenerator = null } = {}) {
    this.#builder = builder;
    this.#klass = klass;
    this.#attributesGenerator = attributesGenerator;
  }

  /**
   * Builds an object using the configured builder or class and optional attributes generator.
   * @param {...*} args - Arguments passed to the attributes generator or directly to the builder.
   * @returns {*} The built object.
   */
  build(...args) {
    const attributes = this.#generateAttributes(...args);
    const builder = this.#builderFunction();
    return builder(...attributes);
  }

  /**
   * Returns the builder function, falling back to the default builder if none was provided.
   * @returns {Function} The builder function.
   */
  #builderFunction() {
    if (typeof this.#builder !== 'function') {
      this.#builder = this.#defaultBuilder();
    }
    return this.#builder;
  }

  /**
   * Returns the default builder function based on the configured class.
   * If a class is set, returns a function that instantiates the class.
   * Otherwise, returns a function that produces an empty object.
   * @returns {Function} The default builder function.
   */
  #defaultBuilder() {
    if (this.#klass) {
      return (...args) => new this.#klass(...args);
    }
    return () => ({});
  }

  /**
   * Generates attributes by delegating to the attributes generator if one is configured.
   * If no generator is configured, the original arguments are returned as-is.
   * @param {...*} args - Arguments to pass to the attributes generator.
   * @returns {Array} An array of generated attributes.
   */
  #generateAttributes(...args) {
    if (this.#attributesGenerator) {
      return [this.#attributesGenerator.generate(...args)];
    }
    return args;
  }
}

export { Factory };