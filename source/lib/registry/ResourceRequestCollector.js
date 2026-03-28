/**
 * ResourceRequestCollector gathers ResourceRequest instances from a ResourceRegistry.
 * It provides methods to retrieve all requests or only those that do not require parameters.
 * @author darthjee
 */
class ResourceRequestCollector {
  /**
   * @param {ResourceRegistry} resourceRegistry The registry containing all resources.
   */
  constructor(resourceRegistry) {
    this.resourceRegistry = resourceRegistry;
  }

  /**
   * Returns a flat array of all ResourceRequest instances from all resources in the registry.
   * @returns {Array<ResourceRequest>} All resource requests across every resource.
   */
  allRequests() {
    return this.resourceRegistry
      .filter(() => true)
      .flatMap((resource) => resource.resourceRequests);
  }

  /**
   * Returns only the ResourceRequest instances that do not require parameter substitution,
   * i.e. those whose URL templates contain no {:placeholder} tokens.
   * These are safe to enqueue at startup without any additional context.
   * @returns {Array<ResourceRequest>} Resource requests that need no parameters.
   */
  requestsNeedingNoParams() {
    return this.allRequests().filter((request) => !request.needsParams());
  }
}

export { ResourceRequestCollector };
