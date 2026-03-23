import { Factory } from './Factory.js';
import { Job } from '../models/Job.js';
import { IdGenerator } from '../utils/IdGenerator.js';

/**
 * JobFactory is responsible for creating Job instances with unique identifiers.
 * It uses the Factory base class to generate Job instances with specified attributes.
 * @author darthjee
 */
class JobFactory extends Factory {
  #clients;

  /**
   * Creates a new JobFactory instance with default settings for Job creation.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is Job).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   * @param {ClientRegistry} options.clients - The clients registry to be used in created Job instances.
   */
  constructor({ klass = Job, attributesGenerator = new IdGenerator(), clients } = {}) {
    super({ klass, attributesGenerator });
    this.#clients = clients;
  }
}

export { JobFactory };