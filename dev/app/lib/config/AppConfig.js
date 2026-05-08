import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { JsonConfig } from './JsonConfig.js';
import { EnvStringResolver } from '../common/utils/env_resolver/EnvStringResolver.js';

/**
 * Top-level configuration class for the dev app.
 * Reads the dev app config file and exposes sub-config instances.
 * Use `AppConfig.load(path)` at application boot to initialise,
 * then access `AppConfig.json` from anywhere.
 */
class AppConfig {
  static #instance = null;

  /**
   * Loads the configuration from the given file path and stores it as the
   * active singleton. Falls back to defaults if the file cannot be read.
   *
   * @param {string} configPath Path to the YAML configuration file.
   * @returns {void}
   */
  static load(configPath) {
    try {
      const raw = load(EnvStringResolver.resolve(readFileSync(configPath, 'utf8')));
      AppConfig.#instance = new AppConfig(raw || {});
    } catch (e) {
      console.warn(`AppConfig: failed to load config file "${configPath}" — ${e.message}`);
      AppConfig.#instance = new AppConfig({});
    }
  }

  /**
   * Returns the active singleton instance, creating a default one if needed.
   * @returns {AppConfig}
   */
  static get instance() {
    if (!AppConfig.#instance) {
      AppConfig.#instance = new AppConfig({});
    }
    return AppConfig.#instance;
  }

  /**
   * Returns the `JsonConfig` instance from the active singleton.
   * @returns {JsonConfig}
   */
  static get json() {
    return AppConfig.instance.json;
  }

  /**
   * Resets the singleton. Intended for use in tests.
   * @returns {void}
   */
  static reset() {
    AppConfig.#instance = null;
  }

  #json;

  /**
   * @param {object} [configData={}] Parsed config data.
   * @param {object} [configData.json] Raw `json` section.
   */
  constructor(configData = {}) {
    this.#json = new JsonConfig(configData.json || {});
  }

  /**
   * Returns the `JsonConfig` instance for this config.
   * @returns {JsonConfig}
   */
  get json() {
    return this.#json;
  }
}

export { AppConfig };
