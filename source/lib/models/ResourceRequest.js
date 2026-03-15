/**
 * ResourceRequest represents a request to a specific URL with an expected status code.
 * @author darthjee
 */
class ResourceRequest {
  /**
   * @param {{ url: string, status: number }} attributes ResourceRequest attributes
   * @param {string} attributes.url The URL to request.
   * @param {number} attributes.status The expected status code of the response.
   */
  constructor({ url, status }) {
    this.url = url;
    this.status = status;
  }

  /**
   * Creates a list of ResourceRequest instances from an array of objects.
   * @param {Array<{ url: string, status: number }>} array list of objects with attributes to create a new ResourceRequest
   * @returns {Array<ResourceRequest>} list of ResourceRequest instances
   */
  static fromList(array) {
    return array.map((resource) => new ResourceRequest(resource));
  }
}

export { ResourceRequest };
