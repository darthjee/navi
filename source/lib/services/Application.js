import { ApplicationInstance } from './ApplicationInstance.js';

/**
 * Application is a static singleton facade that orchestrates the startup of Navi
 * by loading configuration, building registries, and running the Engine loop
 * together with the WebServer.
 *
 * Call `Application.build()` once during bootstrap and `Application.reset()` in tests.
 * @author darthjee
 */
class Application {
  static #instance = null;

  /**
   * Creates and stores the singleton ApplicationInstance.
   * @param {object} [params={}] - Forwarded to `ApplicationInstance` constructor.
   * @returns {ApplicationInstance} The created instance.
   */
  static build(params = {}) {
    Application.#instance = new ApplicationInstance(params);
    return Application.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    Application.#instance = null;
  }

  /**
   * Returns the singleton instance (for test inspection).
   * @returns {ApplicationInstance|null} The current instance.
   */
  static get instance() {
    return Application.#instance;
  }

  /**
   * Returns the current engine status.
   * Returns 'running' if no instance has been built yet.
   * @returns {string} The current status.
   */
  static status() {
    if (!Application.#instance) return 'running';
    return Application.#instance.status();
  }

  /**
   * Returns true if the engine is currently running.
   * @returns {boolean} True if the current status is 'running'.
   */
  static isRunning() {
    return Application.status() === 'running';
  }

  /**
   * Returns true if the engine is currently paused.
   * @returns {boolean} True if the current status is 'paused'.
   */
  static isPaused() {
    return Application.status() === 'paused';
  }

  /**
   * Returns true if the engine is currently stopped.
   * @returns {boolean} True if the current status is 'stopped'.
   */
  static isStopped() {
    return Application.status() === 'stopped';
  }

  /**
   * Loads the configuration from the specified file path.
   * @param {string} configPath - The path to the configuration file.
   * @returns {void}
   */
  static loadConfig(configPath) {
    return Application.#getInstance().loadConfig(configPath);
  }

  /**
   * Starts the application.
   * @returns {Promise<void>}
   */
  static async run() {
    return Application.#getInstance().run();
  }

  /**
   * Builds and returns a new Engine instance.
   * @returns {Engine} The created Engine instance.
   */
  static buildEngine() {
    return Application.#getInstance().buildEngine();
  }

  /**
   * Builds and returns a WebServer or null.
   * @returns {WebServer|null} The created WebServer instance or null.
   */
  static buildWebServer() {
    return Application.#getInstance().buildWebServer();
  }

  /**
   * Enqueues all parameter-free ResourceRequests.
   * @returns {void}
   */
  static enqueueFirstJobs() {
    return Application.#getInstance().enqueueFirstJobs();
  }

  /**
   * Gets the buffered logger from the singleton instance.
   * @returns {BufferedLogger} The buffered logger instance.
   */
  static get bufferedLogger() {
    return Application.#getInstance().bufferedLogger;
  }

  /**
   * Pauses the engine and waits for workers to become idle.
   * @returns {Promise<void>}
   */
  static async pause() {
    return Application.#getInstance().pause();
  }

  /**
   * Stops the engine, waits for workers to idle, then clears job queues.
   * @returns {Promise<void>}
   */
  static async stop() {
    return Application.#getInstance().stop();
  }

  /**
   * Resumes processing after a pause.
   * @returns {Promise<void>}
   */
  static async continue() {
    return Application.#getInstance().continue();
  }

  /**
   * Starts processing from a stopped state.
   * @returns {Promise<void>}
   */
  static async start() {
    return Application.#getInstance().start();
  }

  /**
   * Restarts processing.
   * @returns {Promise<void>}
   */
  static async restart() {
    return Application.#getInstance().restart();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {ApplicationInstance} The singleton instance.
   * @throws {Error} If `build()` has not been called.
   */
  static #getInstance() {
    if (!Application.#instance) {
      throw new Error('Application has not been initialized. Call Application.build() before calling static methods that require an instance.');
    }
    return Application.#instance;
  }
}

export { Application };
