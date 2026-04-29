import express from 'express';
import { Router } from './Router.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Express web server for the Navi monitoring interface.
 * @author darthjee
 */
class WebServer {
  #port;
  #app;
  #httpServer;

  /**
   * @param {object} params - Options for initializing the WebServer.
   * @param {object} params.webConfig - The web configuration object.
   */
  constructor({ webConfig }) {
    this.#port = webConfig.port;
    this.#app = express();
    this.#app.use(new Router({ webConfig }).build());
  }

  /**
   * Starts the Express server on the configured port.
   * Returns a Promise that resolves when the HTTP server fires its 'close' event,
   * or rejects if the server fails to start.
   * @returns {Promise<void>} A Promise that resolves when the server closes.
   */
  start() {
    Logger.info(`Listening to port ${this.#port}`);
    return new Promise((resolve, reject) => {
      this.#httpServer = this.#app.listen(this.#port);
      this.#httpServer.on('close', resolve);
      this.#httpServer.on('error', reject);
    });
  }

  /**
   * Closes the HTTP server, stopping it from accepting new connections.
   * @returns {void}
   */
  shutdown() {
    this.#httpServer?.close();
  }

  /**
   * Factory method. Returns a WebServer when webConfig is present, null otherwise.
   * @param {object} params - Options for building the WebServer.
   * @param {object|null} params.webConfig - The web configuration object.
   * @returns {WebServer|null} A WebServer instance if webConfig is provided, otherwise null.
   */
  static build({ webConfig }) {
    if (!webConfig) return null;
    return new WebServer({ webConfig });
  }
}

export { WebServer };
