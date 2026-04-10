import { VariablesMapper } from './VariablesMapper.js';
import { MissingActionResource } from '../exceptions/MissingActionResource.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Represents a single action to execute after a successful resource request response.
 *
 * Each action holds a reference to a resource name and an optional variables_map
 * that renames response fields into job parameters.
 *
 * TODO: In the future, instead of logging, this method should create a new Job
 * referencing the resource named by this.resource, passing vars as the job
 * parameters. The job will be enqueued for async processing.
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
   * Applies the variables_map to the response item and logs the result.
   * @param {object} item A single parsed response item.
   * @returns {void}
   */
  execute(item) {
    const vars = this.#mapper.map(item);
    Logger.info(`Executing action ${this.resource} for ${JSON.stringify(vars)}`);
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
