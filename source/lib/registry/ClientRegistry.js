import { NamedRegistry } from './NamedRegistry.js';
import { ClientNotFound } from '../exceptions/ClientNotFound.js';

/**
 * ClientRegistry is a helper class that manages client retrieval logic for Config.
 * It encapsulates the logic for fetching clients by name and determining the default client.
 * 
 * @example
 * const clientRegistry = new ClientRegistry({
 *   default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
 *   other: new Client({ name: 'other', baseUrl: 'https://other.com' }),
 * });
 * 
 * clientRegistry.getClient('default'); // returns the default client
 * clientRegistry.getClient('other'); // returns the other client
 * clientRegistry.getClient(); // returns the default client
 * clientRegistry.getClient('nonexistent'); // throws ClientNotFound error
 * 
 * 
 * @example only one client registered
 * const clientRegistry = new ClientRegistry({
 *   only: new Client({ name: 'only', baseUrl: 'https://only.com' }),
 * });
 * 
 * clientRegistry.getClient(); // returns the only client as default
 * clientRegistry.getClient('only'); // returns the only client
 * clientRegistry.getClient('default'); // returns the only client as default
 * 
 * @author darthjee
 */
class ClientRegistry extends NamedRegistry {
  /**
   * The exception class to throw when a client is not found.
   * @see ClientNotFound
   * @type {class}
   * @see NamedRegistry#notFound
   * @see NamedRegistry#notFoundException
   */
  static notFoundException = ClientNotFound;

  /**
   * Retrieves a client by name or the default client if no name is provided.
   * 
   * When `name` is `"default"` or not provided, the method first tries to
   * return the client registered under the `"default"` key.  If no such
   * client exists but exactly one client is registered (under any name),
   * that single client is returned instead.
   * 
   * @param {string} [name] The name of the client to retrieve.
   * @returns {Client} The requested client instance.
   * @throws {ClientNotFound} If the client with the specified name does not exist.
   */
  getClient(name) {
    if (name && name !== 'default') {
      return this.getItem(name);
    }
    return this.#getDefaultClient();
  }

  /**
   * Retrieves the default client.
   * 
   * The default client is determined as follows:
   * 1. If a client is registered under the "default" key, that client is returned.
   * 2. If no client is registered under "default" but exactly one client is registered, that single client is returned.
   * 3. If neither of the above conditions are met, a ClientNotFound error is thrown for "default".
   * 
   * @returns {Client} The default client instance.
   * @throws {ClientNotFound} If no default client exists.
   */
  #getDefaultClient() {
    return this.#fetchDefaultClient() || this.getItem('default');
  }

  /**
   * Fetches the default client.
   * 
   * This method first checks if there is exactly one client registered and returns it as the default.
   * If there are multiple clients, it does not assume a default and returns undefined.
   * 
   * @returns {Client|undefined} The default client instance if found, otherwise undefined.
   */
  #fetchDefaultClient() {
    const clientValues = Object.values(this.items);

    if (clientValues.length === 1) {
      return clientValues[0];
    }
  }
}

export { ClientRegistry };