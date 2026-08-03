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
   * @param {boolean} [config.autostart=true] - Whether the engine starts processing immediately at boot.
   * @param {number} [config.idle_timeout=0] - Seconds of inactivity (no busy workers, no queued jobs) before the application auto-shuts-down. `0` disables auto-shutdown.
   * @param {Array<string|object>} [config.links=[]] - Links shown in the web UI.
   * @param {object} [config.api={}] - Configuration for the token-secured `/api` namespace (`{ token }`).
   */
  constructor({ port, logs_page_size: logsPageSize = 20, enable_shutdown: enableShutdown = true, autostart = true, idle_timeout: idleTimeout = 0, links = [], api = {} }) {
    this.port = port;
    this.logsPageSize = logsPageSize;
    this.enableShutdown = enableShutdown;
    this.autostart = autostart;
    this.idleTimeout = idleTimeout;
    this.links = links.map((link) => Link.fromObject(link));
    this.apiToken = api?.token ?? null;
  }
}

export { WebConfig };
