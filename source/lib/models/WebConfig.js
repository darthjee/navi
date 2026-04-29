/**
 * Represents the web server configuration.
 * @author darthjee
 */
class WebConfig {
  /**
   * @param {object} config - Configuration object.
   * @param {number} config.port - The port number to listen on.
   * @param {number} [config.logs_page_size=20] - Maximum number of log entries per page.
   */
  constructor({ port, logs_page_size: logsPageSize = 20 }) {
    this.port = port;
    this.logsPageSize = logsPageSize;
  }
}

export { WebConfig };
