import { Factory } from './Factory.js';
import { Worker } from '../models/Worker.js';
import { IdGenerator } from '../utils/IdGenerator.js';

/**
 * WorkerFactory is responsible for creating Worker instances with unique identifiers.
 * It uses the Factory base class to generate Worker instances with specified attributes, including references to the JobRegistry and WorkerRegistry.
 * @author darthjee
 */
class WorkerFactory extends Factory {
  #jobRegistry;
  #workerRegistry;

  /**
   * Creates a new WorkerFactory instance with default settings for Worker creation.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is Worker).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   * @param {JobRegistry} options.jobRegistry - The JobRegistry instance to associate with created Workers.
   * @param {WorkerRegistry} options.workerRegistry - The WorkerRegistry instance to associate with created Workers.
   */
  constructor({ klass = Worker, attributesGenerator = new IdGenerator(), jobRegistry, workerRegistry } = {}) {
    super({ klass, attributesGenerator });
    this.#jobRegistry = jobRegistry;
    this.#workerRegistry = workerRegistry;
  }

  /**
   * Builds a new Worker instance with references to the JobRegistry and WorkerRegistry.
   * 
   * It builds the worker by calling the base Factory's build method, passing in the jobRegistry and workerRegistry as part of the attributes for the Worker instance.
   * @returns {Worker} The created Worker instance.
   */
  build() {
    return super.build({ jobRegistry: this.#jobRegistry, workerRegistry: this.#workerRegistry });
  }
}

export { WorkerFactory };