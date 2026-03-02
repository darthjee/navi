/**
 * RequestFailed is a custom error class that represents a failed HTTP request.
 * It includes the status code and URL of the failed request for better error handling and debugging.
 * @author darthjee
 */
class RequestFailed extends Error {
  constructor(statusCode, url, message = 'Request failed') {
    super(`${message}: ${statusCode} for ${url}`);
    this.name = 'RequestFailed';
    this.statusCode = statusCode;
    this.url = url;
  }
}

export { RequestFailed };
