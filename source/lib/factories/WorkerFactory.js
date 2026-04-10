import { Factory } from './Factory.js';
import { Worker } from '../models/Worker.js';
import { IdGenerator } from '../utils/generators/IdGenerator.js';

/**
 * WorkerFactory is responsible for creating Worker instances with unique identifiers.
 * It uses the Factory base class to generate Worker instances with specified attributes.
 * @author darthjee
 */
class WorkerFactory extends Factory {
  /**
   * Creates a new WorkerFactory instance with default settings for Worker creation.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is Worker).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   */
  constructor({ klass = Worker, attributesGenerator = new IdGenerator() } = {}) {
    super({ klass, attributesGenerator });
  }

  /**
   * Builds a new Worker instance.
   * @returns {Worker} The created Worker instance.
   */
  build() {
    return super.build({});
  }
}

export { WorkerFactory };