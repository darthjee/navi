import { WebServer } from '../../server/WebServer.js';

/**
 * ServerController owns construction and lifecycle delegation for the optional
 * `WebServer` on behalf of `ApplicationInstance`, mirroring the way
 * `EngineController` wraps `Engine`.
 * @author darthjee
 */
class ServerController {
  #webServer;

  /**
   * @param {object} [params={}] - Dependency injection parameters.
   * @param {WebServer} [params.webServer] - Wrapped web server instance (injected for testing).
   */
  constructor({ webServer } = {}) {
    this.#webServer = webServer;
  }

  /**
   * Builds a fully wired `ServerController`: constructs it and builds its
   * wrapped `WebServer` (which may be `null` when there's no web config).
   * @param {object} params - Build parameters.
   * @param {object} [params.webConfig] - The web configuration object.
   * @returns {ServerController} The built ServerController instance, never `null`.
   */
  static build({ webConfig }) {
    const controller = new ServerController();
    controller.#webServer = controller.buildWebServer({ webConfig });
    return controller;
  }

  /**
   * Builds and returns a WebServer if web configuration is present, otherwise null.
   * @param {object} params - Build parameters.
   * @param {object} [params.webConfig] - The web configuration object.
   * @returns {WebServer|null} The created WebServer instance or null.
   */
  buildWebServer({ webConfig }) {
    return WebServer.build({ webConfig });
  }

  /**
   * Starts the wrapped web server, if any.
   * @returns {Promise<void>|undefined} The web server's start promise, or undefined when there's no wrapped server.
   */
  start() {
    return this.#webServer?.start();
  }

  /**
   * Shuts down the wrapped web server, if any.
   * @returns {Promise<void>|undefined} The web server's shutdown result, or undefined when there's no wrapped server.
   */
  shutdown() {
    return this.#webServer?.shutdown();
  }
}

export { ServerController };
