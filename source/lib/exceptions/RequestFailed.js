class RequestFailed extends Error {
  constructor(statusCode, message = 'Request failed') {
    super(`${message}: ${statusCode}`);
    this.name = 'RequestFailed';
    this.statusCode = statusCode;
  }
}

module.exports = RequestFailed;
