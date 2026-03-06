import { ResourceRequest } from './ResourceRequest.js';

/**
 * Resource class represents a resource with a name and associated resource requests.
 * @author darthjee
 */
class Resource {
  /**
   * Represents a resource with a name and associated resource requests.
   * @param {object} params - The parameters for creating a Resource instance.
   * @param {string} params.name - The name of the resource.
   * @param {Array} params.resourceRequests - The resource requests associated with the resource.
   */
  constructor({ name, resourceRequests }) {
    this.name = name;
    this.resourceRequests = resourceRequests;
  }

  static fromObject(obj) {
    return new Resource({
      name: obj.name,
      resourceRequests: ResourceRequest.fromList(obj.resourceRequests)
    });
  }

  static fromListObject(object) {
    Object.entries(object).map(([resourceName, requests]) => {
      return Resource.fromObject({ name: resourceName, resourceRequests: requests});
    });
  }
}

export { Resource };