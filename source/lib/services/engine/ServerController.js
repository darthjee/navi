import { WebServer } from '../../server/WebServer.js';
import { MemorySampler } from '../memory/MemorySampler.js';

/**
 * ServerController owns construction and lifecycle delegation for the optional
 * `WebServer` (and its `MemorySampler`) on behalf of `ApplicationInstance`,
 * mirroring the way `EngineController` wraps `Engine`.
 * @author darthjee
 */
class ServerController {
  #webServer;
  #sampler;

  /**
   * @param {object} [params={}] - Dependency injection parameters.
   * @param {WebServer} [params.webServer] - Wrapped web server instance (injected for testing).
   * @param {MemorySampler} [params.sampler] - Wrapped memory sampler instance (injected for testing).
   */
  constructor({ webServer, sampler } = {}) {
    this.#webServer = webServer;
    this.#sampler = sampler;
  }

  /**
   * Builds a fully wired `ServerController`: constructs it and builds its
   * wrapped `WebServer` (which may be `null` when there's no web config) and
   * `MemorySampler` (which is only built alongside a `WebServer`).
   * @param {object} params - Build parameters.
   * @param {object} [params.webConfig] - The web configuration object.
   * @returns {ServerController} The built ServerController instance, never `null`.
   */
  static build({ webConfig }) {
    const controller = new ServerController();
    controller.#webServer = controller.buildWebServer({ webConfig });
    controller.#sampler = controller.buildSampler({ webConfig });
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
   * Builds and returns a MemorySampler if web configuration is present, otherwise null.
   * `webConfig` presence is equivalent to `#webServer` being non-null: this keeps
   * "no `web:` section → no sampler" true, even though `ServerController` itself is
   * always constructed.
   * @param {object} params - Build parameters.
   * @param {object} [params.webConfig] - The web configuration object.
   * @returns {MemorySampler|null} The created MemorySampler instance or null.
   */
  buildSampler({ webConfig }) {
    if (!webConfig) return null;

    return new MemorySampler(webConfig.memory);
  }

  /**
   * Starts the wrapped web server and memory sampler, if any.
   * @returns {Promise<void>|undefined} The web server's start promise, or undefined when there's no wrapped server.
   */
  start() {
    this.#sampler?.start();
    return this.#webServer?.start();
  }

  /**
   * Stops the memory sampler (synchronously, before the web server shutdown so
   * sampling stops even if the web server shutdown rejects) and shuts down the
   * wrapped web server, if any.
   * @returns {Promise<void>|undefined} The web server's shutdown result, or undefined when there's no wrapped server.
   */
  shutdown() {
    this.#sampler?.stop();
    return this.#webServer?.shutdown();
  }
}

export { ServerController };
