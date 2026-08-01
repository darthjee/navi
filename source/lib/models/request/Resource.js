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
   * @param {string} [params.namespace='default'] - The namespace this resource was declared in.
   */
  constructor({ name, resourceRequests, namespace = 'default' }) {
    this.name = name;
    this.resourceRequests = resourceRequests;
    this.namespace = namespace;
  }

  /**
   * Creates a Resource instance from a plain object.
   * @param {object} obj - The plain object representing a resource.
   * @param {string} obj.name - The name of the resource.
   * @param {string|{name: string, namespace: string}} [obj.client] - The client to use for requests from
   * this resource: either the bare client name, or an object with an explicit target `namespace`.
   * @param {Array<{url: string, status: number}>} obj.resourceRequests -
   * The resource requests associated with the resource.
   * @param {object} [options={}] - Additional options.
   * @param {string} [options.namespace='default'] - The namespace this resource was declared in.
   * @returns {Resource} A new Resource instance.
   */
  static fromObject(obj, { namespace = 'default' } = {}) {
    return new Resource({
      name: obj.name,
      namespace,
      resourceRequests: ResourceRequest.fromList(obj.resourceRequests, { clientName: obj.client, namespace })
    });
  }

  /**
   * Creates a list of Resource instances from a plain object.
   * @param {object} object - The plain object representing multiple resources.
   * @param {object} [options={}] - Additional options.
   * @param {string} [options.namespace='default'] - The namespace these resources were declared in.
   * @returns {Array<Resource>} A list of Resource instances.
   */
  static fromListObject(object, { namespace = 'default' } = {}) {
    return Object.entries(object).map(([resourceName, requests]) => {
      return Resource.fromObject({ name: resourceName, resourceRequests: requests }, { namespace });
    });
  }
}

export { Resource };