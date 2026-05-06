import { JobRegistry as DefaultJobRegistry } from '../../background/JobRegistry.js';
import { MissingActionResource } from '../../exceptions/registry/MissingActionResource.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { ResourceRegistry as DefaultResourceRegistry } from '../../registry/ResourceRegistry.js';
import { Application } from '../../services/Application.js';
import { PaginationConfig } from '../configs/PaginationConfig.js';

/**
 * Represents a single paginated action to execute after a successful resource request response.
 *
 * Iterates over pages and enqueues one ResourceRequestJob per page, merging the page number
 * into the item's existing parameters.
 * @author darthjee
 */
class ResourceRequestPaginatedAction {
  #resource;
  #pagination;
  #jobRegistry;
  #resourceRegistry;

  /**
   * @param {object} attributes Action attributes.
   * @param {string} attributes.resource Name of the resource to act upon.
   * @param {Array<object>} attributes.pagination Pagination config list.
   * @param {object} [attributes.jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {object} [attributes.resourceRegistry=ResourceRegistry] The resource registry to look up resources.
   * @throws {MissingActionResource} If resource is absent or falsy.
   */
  constructor({
    resource,
    pagination,
    jobRegistry = DefaultJobRegistry,
    resourceRegistry = DefaultResourceRegistry,
  }) {
    if (!resource) throw new MissingActionResource();
    this.#resource = resource;
    this.#pagination = PaginationConfig.fromList(pagination);
    this.#jobRegistry = jobRegistry;
    this.#resourceRegistry = resourceRegistry;
  }

  /**
   * Evaluates the page count from the response, then enqueues one
   * ResourceRequestJob per page for the target resource.
   * @param {ResponseWrapper} responseWrapper A ResponseWrapper instance exposing parsedBody and headers.
   * @returns {void}
   */
  execute(responseWrapper) {
    if (Application.isStopped()) return;

    const count = this.#pagination.resolvePages(responseWrapper);
    const pages = this.#pagination.pageNumbers(count);
    const resource = this.#resourceRegistry.getItem(this.#resource);
    const existingParams = responseWrapper.parameters ?? {};

    for (const page of pages) {
      const parameters = { ...existingParams, [this.#pagination.pageKey]: page };
      for (const resourceRequest of resource.resourceRequests) {
        this.#jobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters });
      }
    }
  }

  /**
   * Creates instances from a raw YAML list, skipping invalid entries.
   * @param {Array<object>} [array=[]] Raw paginated action config entries.
   * @returns {Array<ResourceRequestPaginatedAction>} Valid paginated action instances.
   */
  static fromList(array = []) {
    return array.flatMap((attrs) => {
      try {
        return [new ResourceRequestPaginatedAction(attrs)];
      } catch (error) {
        LogRegistry.error(`Skipping paginated_action: ${error}`);
        return [];
      }
    });
  }
}

export { ResourceRequestPaginatedAction };
