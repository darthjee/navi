import { JobRegistry as DefaultJobRegistry } from 'deku-swarm';
import { MissingActionResource } from '../../exceptions/registry/MissingActionResource.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { NamespaceMap as DefaultNamespaceMap } from '../../registry/NamespaceMap.js';
import { Application } from '../../services/application/Application.js';
import { PageRange } from '../configs/PageRange.js';
import { PaginationConfig } from '../configs/PaginationConfig.js';
import { ParametersMapper } from '../response/ParametersMapper.js';

/**
 * Represents a single paginated action to execute after a successful resource request response.
 *
 * Iterates over pages and enqueues one ResourceRequestJob per page, merging the page number
 * into the item's existing parameters.
 * @author darthjee
 */
class ResourceRequestPaginatedAction {
  #resource;
  #namespace;
  #originNamespace;
  #pagination;
  #mapper;
  #jobRegistry;
  #namespaceMap;

  /**
   * @param {object} attributes Action attributes.
   * @param {string} attributes.resource Name of the resource to act upon.
   * @param {string|null} [attributes.namespace=null] Explicit target namespace for the resource
   * lookup. When omitted, resolution first tries `originNamespace`, then falls back to `default`.
   * @param {string} [attributes.originNamespace='default'] The namespace of the resource that owns
   * this paginated action. Threaded in at construction time, not read from YAML.
   * @param {Array<object>} attributes.pagination Pagination config list.
   * @param {object} [attributes.parameters={}] Key-value map where keys are destination
   * variable names and values are path expressions (e.g. `parsedBody.id`, `headers['page']`),
   * resolved against the same response used to compute `pages` and merged into each page's
   * parameters (overriding same-named inherited parameters, but always losing to `page_key`).
   * @param {object} [attributes.jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {object} [attributes.namespaceMap=NamespaceMap] The namespace map used to look up resources.
   * @throws {MissingActionResource} If resource is absent or falsy.
   */
  constructor({
    resource,
    namespace = null,
    originNamespace = 'default',
    pagination,
    parameters = {},
    jobRegistry = DefaultJobRegistry,
    namespaceMap = DefaultNamespaceMap,
  }) {
    if (!resource) throw new MissingActionResource();
    this.#resource = resource;
    this.#namespace = namespace;
    this.#originNamespace = originNamespace;
    this.#pagination = PaginationConfig.fromList(pagination);
    this.#mapper = new ParametersMapper(parameters);
    this.#jobRegistry = jobRegistry;
    this.#namespaceMap = namespaceMap;
  }

  /**
   * The name of the resource to act upon.
   * @returns {string} The resource name.
   */
  get resource() {
    return this.#resource;
  }

  /**
   * The explicit target namespace for the resource lookup, or null when not given.
   * @returns {string|null} The explicit target namespace.
   */
  get namespace() {
    return this.#namespace;
  }

  /**
   * The namespace of the resource that owns this paginated action.
   * @returns {string} The origin namespace.
   */
  get originNamespace() {
    return this.#originNamespace;
  }

  /**
   * Evaluates the page count from the response, then enqueues one
   * ResourceRequestJob per page for the target resource.
   * @param {ResponseWrapper} responseWrapper A ResponseWrapper instance exposing parsedBody and headers.
   * @param {object} [parameters={}] The original request parameters to merge with the page number.
   * @returns {void}
   */
  execute(responseWrapper, parameters = {}) {
    if (Application.isStopped()) return;

    const count = this.#pagination.resolvePages(responseWrapper);
    const resource = this.#namespaceMap.getResource(this.#originNamespace, this.#resource, this.#namespace);
    const mappedParameters = this.#mapper.map(responseWrapper);

    for (const resourceRequest of resource.resourceRequests) {
      if (resourceRequest.disabled) continue;

      new PageRange({
        count,
        zeroIndexed: this.#pagination.zeroIndexed,
        maxPage: resourceRequest.maxPage,
      }).each((page) => {
        const pageParameters = {
          ...parameters,
          ...mappedParameters,
          [this.#pagination.pageKey]: page,
        };
        this.#jobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: pageParameters });
      });
    }
  }

  /**
   * Creates instances from a raw YAML list, skipping invalid entries.
   * @param {Array<object>} [array=[]] Raw paginated action config entries.
   * @param {object} [options={}] Additional options.
   * @param {string} [options.originNamespace='default'] The namespace of the resource that owns these actions.
   * @returns {Array<ResourceRequestPaginatedAction>} Valid paginated action instances.
   */
  static fromList(array = [], { originNamespace = 'default' } = {}) {
    return array.flatMap((attrs) => {
      try {
        return [new ResourceRequestPaginatedAction({ ...attrs, originNamespace })];
      } catch (error) {
        LogRegistry.error(`Skipping paginated_action: ${error}`);
        return [];
      }
    });
  }
}

export { ResourceRequestPaginatedAction };
