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
}

export { ResourceRequest };
