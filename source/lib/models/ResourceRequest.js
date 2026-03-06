/**
 * ResourceRequest represents a request to a specific URL with an expected status code.
 * @author darthjee
 */
class ResourceRequest {
  /**
   * @param {object} attributes ResourceRequest attributes
   * @param {string} attributes.url The URL to request.
   * @param {string} attributes.status The expected status code of the response.
   */
  constructor({ url, status }) {
    this.url = url;
    this.status = status;
  }

  /**
   * Creates a list of ResourceRequest instances from an array of objects.
   * @param {array} array list of objects with attributes to create a new ResourceRequest
   * @returns {array} list of ResourceRequest instances
   */
  static fromList(array) {
    return array.map((resource) => new ResourceRequest(resource)); 
  }
}

export { ResourceRequest };
