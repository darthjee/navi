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

  /**
   * Creates a Resource instance from a plain object.
   * @param {object} obj - The plain object representing a resource.
   * @param {string} obj.name - The name of the resource.
   * @param {string} [obj.client] - The name of the client to use for requests from this resource.
   * @param {Array<{url: string, status: number}>} obj.resourceRequests -
   * The resource requests associated with the resource.
   * @returns {Resource} A new Resource instance.
   */
  static fromObject(obj) {
    return new Resource({
      name: obj.name,
      resourceRequests: ResourceRequest.fromList(obj.resourceRequests, { clientName: obj.client })
    });
  }

  /**
   * Creates a list of Resource instances from a plain object.
   * @param {object} object - The plain object representing multiple resources.
   * @returns {Array<Resource>} A list of Resource instances.
   */
  static fromListObject(object) {
    return Object.entries(object).map(([resourceName, requests]) => {
      return Resource.fromObject({ name: resourceName, resourceRequests: requests});
    });
  }
}

export { Resource };