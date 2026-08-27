import { JobRegistry as DefaultJobRegistry } from 'deku-swarm';
import { MissingActionResource } from '../../exceptions/registry/MissingActionResource.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { NamespaceMap as DefaultNamespaceMap } from '../../registry/NamespaceMap.js';
import { Application } from '../../services/application/Application.js';
import { ParametersMapper } from '../response/ParametersMapper.js';

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
  #namespaceMap;

  /**
   * @param {object} attributes Action attributes.
   * @param {string} attributes.resource Name of the resource to act upon.
   * @param {string|null} [attributes.namespace=null] Explicit target namespace for the resource
   * lookup. When omitted, resolution first tries `originNamespace`, then falls back to `default`.
   * @param {string} [attributes.originNamespace='default'] The namespace of the resource that owns
   * this action (i.e. the namespace this action was declared under). Threaded in at construction
   * time, not read from YAML.
   * @param {object} [attributes.parameters={}] Key-value map where keys are destination
   * variable names and values are path expressions (e.g. `parsedBody.id`, `headers['page']`).
   * @param {object} [attributes.jobRegistry=JobRegistry] The job registry to enqueue jobs to.
   * @param {object} [attributes.namespaceMap=NamespaceMap] The namespace map used to look up resources.
   * @throws {MissingActionResource} If resource is absent or falsy.
   */
  constructor({
    resource,
    namespace = null,
    originNamespace = 'default',
    parameters = {},
    jobRegistry = DefaultJobRegistry,
    namespaceMap = DefaultNamespaceMap,
  }) {
    if (!resource) throw new MissingActionResource();
    this.resource = resource;
    this.namespace = namespace;
    this.originNamespace = originNamespace;
    this.#mapper = new ParametersMapper(parameters);
    this.#jobRegistry = jobRegistry;
    this.#namespaceMap = namespaceMap;
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
    const resource = this.#namespaceMap.getResource(this.originNamespace, this.resource, this.namespace);

    for (const resourceRequest of resource.resourceRequests) {
      if (resourceRequest.disabled) continue;

      this.#jobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: vars });
    }
  }

  /**
   * Creates a list of ResourceRequestAction instances from an array of raw config objects.
   * Entries that fail to construct (e.g. missing resource) are logged and skipped.
   * @param {Array<object>} [array=[]] Raw action config entries.
   * @param {object} [options={}] Additional options.
   * @param {string} [options.originNamespace='default'] The namespace of the resource that owns these actions.
   * @returns {Array<ResourceRequestAction>} Valid action instances.
   */
  static fromList(array = [], { originNamespace = 'default' } = {}) {
    return array.flatMap((attrs) => {
      try {
        return [new ResourceRequestAction({ ...attrs, originNamespace })];
      } catch (error) {
        LogRegistry.error(`Skipping action: ${error}`);
        return [];
      }
    });
  }
}

export { ResourceRequestAction };
