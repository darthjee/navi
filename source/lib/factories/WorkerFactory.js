import { Factory } from './Factory.js';
import { Worker } from '../models/Worker.js';
import { IdGenerator } from '../utils/generators/IdGenerator.js';

/**
 * WorkerFactory is responsible for creating Worker instances with unique identifiers.
 * It uses the Factory base class to generate Worker instances with specified attributes.
 * @author darthjee
 */
class WorkerFactory extends Factory {
  #registries;

  /**
   * Creates a new WorkerFactory instance.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is Worker).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   * @param {object} [options.jobRegistry] - The job registry to inject into each Worker.
   * @param {object} [options.workersRegistry] - The workers registry to inject into each Worker.
   */
  constructor({ klass = Worker, attributesGenerator = new IdGenerator(), jobRegistry, workersRegistry } = {}) {
    super({ klass, attributesGenerator });
    this.#registries = { jobRegistry, workersRegistry };
  }

  /**
   * Builds a new Worker instance.
   * @returns {Worker} The created Worker instance.
   */
  build() {
    return super.build({ ...this.#registries });
  }
}

export { WorkerFactory };