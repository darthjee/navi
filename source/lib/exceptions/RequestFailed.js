class RequestFailed extends Error {
  constructor(statusCode, url, message = 'Request failed') {
    super(`${message}: ${statusCode} for ${url}`);
    this.name = 'RequestFailed';
    this.statusCode = statusCode;
    this.url = url;
  }
}

export { RequestFailed };
