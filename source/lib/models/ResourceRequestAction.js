import { ParametersMapper } from './ParametersMapper.js';
import { MissingActionResource } from '../exceptions/MissingActionResource.js';
import { JobRegistry as DefaultJobRegistry } from '../registry/JobRegistry.js';
import { ResourceRegistry as DefaultResourceRegistry } from '../registry/ResourceRegistry.js';
import { Application } from '../services/Application.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Represents a single action to execute after a successful resource request response.
 *
 * Each action holds a reference to a resource name and an optional parameters
 * map that extracts response fields into job parameters via path expressions.
 * When executed, it looks up the target resource and enqueues one
 * ResourceRequestJob per ResourceRequest in that resource, passing the
 * mapped variables as job parameters.
 * @author darthjee
 */
class ResourceRequestAction {
  #mapper;
  #jobRegistry;
  #resourceRegistry;

  /**
   * @param {object} attributes Action attributes.
   * @param {string} attributes.resource Name of the resource to act upon.
   * @param {object} [attributes.parameters={}] Key-value map where keys are destination
   * variable names and values are path expressions (e.g. `parsedBody.id`, `headers['page']`).
   * @param {object} [attributes.jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {object} [attributes.resourceRegistry=ResourceRegistry] The resource registry to look up resources.
   * @throws {MissingActionResource} If resource is absent or falsy.
   */
  constructor({ resource, parameters = {}, jobRegistry = DefaultJobRegistry, resourceRegistry = DefaultResourceRegistry }) {
    if (!resource) throw new MissingActionResource();
    this.resource = resource;
    this.#mapper = new ParametersMapper(parameters);
    this.#jobRegistry = jobRegistry;
    this.#resourceRegistry = resourceRegistry;
  }

  /**
   * Maps the response wrapper to variables, looks up the target resource, and
   * enqueues one ResourceRequestJob per ResourceRequest in that resource.
   * Does nothing if the application is in 'stopped' status.
   * @param {ResponseWrapper} responseWrapper A ResponseWrapper instance exposing
   * parsedBody and headers.
   * @returns {void}
   */
  execute(responseWrapper) {
    if (Application.isStopped()) return;
    const vars = this.#mapper.map(responseWrapper);
    const resource = this.#resourceRegistry.getItem(this.resource);

    for (const resourceRequest of resource.resourceRequests) {
      this.#jobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: vars });
    }
  }

  /**
   * Creates a list of ResourceRequestAction instances from an array of raw config objects.
   * Entries that fail to construct (e.g. missing resource) are logged and skipped.
   * @param {Array<object>} [array=[]] Raw action config entries.
   * @returns {Array<ResourceRequestAction>} Valid action instances.
   */
  static fromList(array = []) {
    return array.flatMap((attrs) => {
      try {
        return [new ResourceRequestAction(attrs)];
      } catch (error) {
        Logger.error(`Skipping action: ${error}`);
        return [];
      }
    });
  }
}

export { ResourceRequestAction };
