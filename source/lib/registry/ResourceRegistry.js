import { NamedRegistry } from './NamedRegistry.js';
import { ResourceNotFound } from '../exceptions/ResourceNotFound.js';

/**
 * Registry of named Resource instances.
 *
 * Implements a static singleton facade: call `ResourceRegistry.build(items)` once
 * during application bootstrap, then use static delegation methods (`getItem`,
 * `filter`, `size`) to access the registry. Use `ResourceRegistry.reset()` in
 * tests to restore a clean state between examples.
 * @author darthjee
 * @augments NamedRegistry
 */
class ResourceRegistry extends NamedRegistry {
  /**
   * The exception class to throw when a resource is not found.
   * @see ResourceNotFound
   * @type {class}
   * @see NamedRegistry#notFound
   * @see NamedRegistry#notFoundException
   */
  static notFoundException = ResourceNotFound;

  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} items - An object mapping resource names to Resource instances.
   * @returns {ResourceRegistry} The created instance.
   * @throws {Error} If `build()` has already been called without a preceding `reset()`.
   */
  static build(items) {
    if (ResourceRegistry.#instance) {
      throw new Error('ResourceRegistry.build() has already been called. Call reset() first.');
    }
    ResourceRegistry.#instance = new ResourceRegistry(items);
    return ResourceRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    ResourceRegistry.#instance = null;
  }

  /**
   * Retrieves a resource by name from the singleton instance.
   * @param {string} name - The name of the resource to retrieve.
   * @returns {*} The resource associated with the given name.
   * @throws {ResourceNotFound} If the resource with the specified name does not exist.
   * @throws {Error} If `build()` has not been called.
   */
  static getItem(name) {
    return ResourceRegistry.#getInstance().getItem(name);
  }

  /**
   * Filters the resources in the singleton instance based on a predicate function.
   * @param {function} predicate - The predicate function to test each resource.
   * @returns {Array} An array of resources that match the predicate.
   * @throws {Error} If `build()` has not been called.
   */
  static filter(predicate) {
    return ResourceRegistry.#getInstance().filter(predicate);
  }

  /**
   * Returns the number of resources in the singleton instance.
   * @returns {number} The number of resources in the registry.
   * @throws {Error} If `build()` has not been called.
   */
  static size() {
    return ResourceRegistry.#getInstance().size();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {ResourceRegistry} The singleton instance.
   * @throws {Error} If `build()` has not been called.
   */
  static #getInstance() {
    if (!ResourceRegistry.#instance) {
      throw new Error('ResourceRegistry has not been built. Call ResourceRegistry.build() first.');
    }
    return ResourceRegistry.#instance;
  }
}

export { ResourceRegistry };