/**
 * Represents the web server configuration.
 * @author darthjee
 */
class WebConfig {
  /**
   * @param {object} config - Configuration object.
   * @param {number} config.port - The port number to listen on.
   */
  constructor({ port }) {
    this.port = port;
  }
}

export { WebConfig };
