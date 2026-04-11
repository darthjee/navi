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

  /**
   * @param {object} params - Options for initializing the WebServer.
   * @param {number} params.port - Port to listen on.
   */
  constructor({ port }) {
    this.#port = port;
    this.#app = express();
    this.#app.use(new Router().build());
  }

  /**
   * Starts the Express server on the configured port.
   * The returned http.Server can be used to close the server (e.g. in tests).
   * @returns {http.Server} The http.Server instance.
   */
  start() {
    Logger.info(`Listening to port ${this.#port}`);
    return this.#app.listen(this.#port);
  }

  /**
   * Factory method. Returns a WebServer when webConfig is present, null otherwise.
   * @param {object} params - Options for building the WebServer.
   * @param {object|null} params.webConfig - The web configuration object.
   * @returns {WebServer|null} A WebServer instance if webConfig is provided, otherwise null.
   */
  static build({ webConfig }) {
    if (!webConfig) return null;
    return new WebServer({ port: webConfig.port });
  }
}

export { WebServer };
