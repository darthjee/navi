import express from 'express';
import { Router } from './Router.js';

/**
 * Express web server for the Navi monitoring interface.
 * @author darthjee
 */
class WebServer {
  #port;
  #app;

  /**
   * @param {object} params
   * @param {number} params.port - Port to listen on.
   * @param {object} params.jobRegistry - The job registry instance.
   * @param {object} params.workersRegistry - The workers registry instance.
   */
  constructor({ port, jobRegistry, workersRegistry }) {
    this.#port = port;
    this.#app = express();
    this.#app.use(new Router({ jobRegistry, workersRegistry }).build());
  }

  /**
   * Starts the Express server on the configured port.
   * The returned http.Server can be used to close the server (e.g. in tests).
   * @returns {object} The http.Server instance.
   */
  start() {
    return this.#app.listen(this.#port);
  }

  /**
   * Factory method. Returns a WebServer when webConfig is present, null otherwise.
   * @param {object} params
   * @param {object|null} params.webConfig - The web configuration object.
   * @param {object} params.jobRegistry - The job registry instance.
   * @param {object} params.workersRegistry - The workers registry instance.
   * @returns {WebServer|null}
   */
  static build({ webConfig, jobRegistry, workersRegistry }) {
    if (!webConfig) return null;
    return new WebServer({ port: webConfig.port, jobRegistry, workersRegistry });
  }
}

export { WebServer };
