/**
 * A flexible factory class that can be configured with a class and an attributes generator.
 *
 * The factory builds objects using the provided class,
 * and can generate attributes using the attributes generator.
 * @author darthjee
 */
class Factory {
  #klass;
  #attributesGenerator;

  /**
   * Creates a new Factory instance.
   * @param {object} params - The parameters for configuring the factory.
   * @param {Function|null} params.klass - A class used to instantiate objects.
   * @param {object|null} params.attributesGenerator - An object with a `generate` method that produces attributes before building.
   * @example <caption>Default factory (builds plain objects)</caption>
   * const factory = new Factory();
   * factory.build(); // => {}
   * @example <caption>Factory with a class</caption>
   * const factory = new Factory({ klass: MyModel });
   * factory.build({ name: 'foo' }); // => new MyModel({ name: 'foo' })
   * @example <caption>Factory with an attributes generator</caption>
   * const idGenerator = new IdGenerator();
   * const factory = new Factory({ klass: MyModel, attributesGenerator: idGenerator });
   * factory.build({ name: 'foo' }); // => new MyModel({ id: '<uuid>', name: 'foo' })
   */
  constructor({ klass = null, attributesGenerator = null } = {}) {
    this.#klass = klass;
    this.#attributesGenerator = attributesGenerator;
  }

  /**
   * Builds an object using the configured class and optional attributes generator.
   * @param {...*} args - Arguments passed to the attributes generator or directly to the class constructor.
   * @returns {*} The built object.
   * @example <caption>Building without arguments</caption>
   * const factory = new Factory({ klass: MyModel });
   * factory.build(); // => new MyModel()
   * @example <caption>Building with arguments</caption>
   * const factory = new Factory({ klass: MyModel });
   * factory.build({ value: 'custom' }); // => new MyModel({ value: 'custom' })
   * @example <caption>Building with an attributes generator that enriches arguments</caption>
   * const idGenerator = new IdGenerator();
   * const factory = new Factory({ klass: MyModel, attributesGenerator: idGenerator });
   * factory.build({ name: 'foo' }); // => new MyModel({ id: '<uuid>', name: 'foo' })
   */
  build(...args) {
    const attributes = this.#generateAttributes(...args);
    return this.#buildInstance(...attributes);
  }

  /**
   * Builds an instance using the configured class or returns a plain object.
   * @param {...*} args - Arguments to pass to the class constructor.
   * @returns {*} The built instance.
   */
  #buildInstance(...args) {
    if (this.#klass) {
      return new this.#klass(...args);
    }
    return {};
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