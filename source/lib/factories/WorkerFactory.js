import { Factory } from './Factory.js';
import { Worker } from '../models/Worker.js';
import { IdGenerator } from '../utils/generators/IdGenerator.js';

/**
 * WorkerFactory is responsible for creating Worker instances with unique identifiers.
 * It uses the Factory base class to generate Worker instances with specified attributes, including a reference to the WorkerRegistry.
 * @author darthjee
 */
class WorkerFactory extends Factory {
  #workerRegistry;

  /**
   * Creates a new WorkerFactory instance with default settings for Worker creation.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is Worker).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   * @param {WorkerRegistry} options.workerRegistry - The WorkerRegistry instance to associate with created Workers.
   */
  constructor({ klass = Worker, attributesGenerator = new IdGenerator(), workerRegistry } = {}) {
    super({ klass, attributesGenerator });
    this.#workerRegistry = workerRegistry;
  }

  /**
   * Builds a new Worker instance with a reference to the WorkerRegistry.
   *
   * It builds the worker by calling the base Factory's build method, passing in the workerRegistry as part of the attributes for the Worker instance.
   * @returns {Worker} The created Worker instance.
   */
  build({ workerRegistry } = {}) {
    return super.build({ workerRegistry: workerRegistry || this.#workerRegistry });
  }
}

export { WorkerFactory };