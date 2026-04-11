import { VariablesMapper } from './VariablesMapper.js';
import { MissingActionResource } from '../exceptions/MissingActionResource.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { ResourceRegistry } from '../registry/ResourceRegistry.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Represents a single action to execute after a successful resource request response.
 *
 * Each action holds a reference to a resource name and an optional variables_map
 * that renames response fields into job parameters. When executed, it looks up the
 * target resource and enqueues one ResourceRequestJob per ResourceRequest in that
 * resource, passing the mapped variables as job parameters.
 * @author darthjee
 */
class ResourceRequestAction {
  #mapper;

  /**
   * @param {object} attributes Action attributes.
   * @param {string} attributes.resource Name of the resource to act upon.
   * @param {object} [attributes.variables_map={}] Key-value map renaming response fields to variable names.
   * @throws {MissingActionResource} If resource is absent or falsy.
   */
  constructor({ resource, variables_map = {} }) {
    if (!resource) throw new MissingActionResource();
    this.resource = resource;
    this.#mapper = new VariablesMapper(variables_map);
  }

  /**
   * Maps the response item to variables, looks up the target resource, and
   * enqueues one ResourceRequestJob per ResourceRequest in that resource.
   * @param {object} item A single parsed response item.
   * @returns {void}
   */
  execute(item) {
    const vars = this.#mapper.map(item);
    const resource = ResourceRegistry.getItem(this.resource);

    for (const resourceRequest of resource.resourceRequests) {
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: vars });
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
