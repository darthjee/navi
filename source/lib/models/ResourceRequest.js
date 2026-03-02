/**
 * ResourceRequest represents a request to a specific URL with an expected status code.
 * @author darthjee
 */
class ResourceRequest {
  /**
   * @param {string} url The URL to request
   * @param {number} status The expected status code of the response
   */
  constructor({ url, status }) {
    this.url = url;
    this.status = status;
  }
}

export { ResourceRequest };
