import { Factory } from './Factory.js';
import { ResourceRequestJob } from '../models/ResourceRequestJob.js';
import { IdGenerator } from '../utils/generators/IdGenerator.js';

/**
 * JobFactory is responsible for creating Job instances with unique identifiers.
 * Constructor-time attributes are merged with build-time params on every build call.
 * @author darthjee
 */
class JobFactory extends Factory {
  #attributes;

  /**
   * Creates a new JobFactory instance.
   * @param {object} options - Configuration options for the factory.
   * @param {class} options.klass - The class to instantiate (default is ResourceRequestJob).
   * @param {object} options.attributesGenerator - The generator for unique attributes (default is IdGenerator).
   * @param {object} options.attributes - Attributes injected into every built instance (e.g. { clients }).
   */
  constructor({ klass = ResourceRequestJob, attributesGenerator = new IdGenerator(), attributes = {} } = {}) {
    super({ klass, attributesGenerator });
    this.#attributes = attributes;
  }

  /**
   * Builds a new Job instance, merging constructor-level attributes with the given params.
   * @param {object} params - The parameters for building a Job instance.
   * @param {ResourceRequest} params.resourceRequest - The resource request associated with the Job.
   * @param {object} params.parameters - Additional parameters for the Job.
   * @returns {Job} A new Job instance.
   * @override
   */
  build(params) {
    return super.build({ ...this.#attributes, ...params });
  }
}

export { JobFactory };
