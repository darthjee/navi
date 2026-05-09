import { Link } from './Link.js';

/**
 * Represents the web server configuration.
 * @author darthjee
 */
class WebConfig {
  /**
   * @param {object} config - Configuration object.
   * @param {number} config.port - The port number to listen on.
   * @param {number} [config.logs_page_size=20] - Maximum number of log entries per page.
   * @param {boolean} [config.enable_shutdown=true] - Whether the shutdown button is enabled.
   * @param {Array<string|object>} [config.links=[]] - Links shown in the web UI.
   */
  constructor({ port, logs_page_size: logsPageSize = 20, enable_shutdown: enableShutdown = true, links = [] }) {
    this.port = port;
    this.logsPageSize = logsPageSize;
    this.enableShutdown = enableShutdown;
    this.links = links.map((link) => Link.fromObject(link));
  }
}

export { WebConfig };
