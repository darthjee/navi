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
class ClientRegistry {
  /**
   * Creates a new ClientRegistry instance.
   * @param {object} clients An object mapping client names to Client instances.
   */
  constructor(clients) {
    this.clients = clients;
  }
  
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
    return this.#fetchClient(name) || this.#getDefaultClient();
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
    return this.#fetchDefaultClient() || this.#fetchClient('default') || this.#clientNotFound('default');
  }

  /**
   * Fetches a client by name.
   * @param {string} name The name of the client to fetch.
   * @returns {Client|undefined} The client instance if found, otherwise undefined.
   */
  #fetchClient(name) {
    if (name in this.clients) {
      return this.clients[name];
    }

    if (name && name !== 'default') {
      this.#clientNotFound(name);
    }
  }

  /**
   * Throws a ClientNotFound error for the specified client name.
   * @param {string} name The name of the client that was not found.
   * @throws {ClientNotFound} Always throws a ClientNotFound error.
   */
  #clientNotFound(name) {
    throw new ClientNotFound(name);
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
    const clientValues = Object.values(this.clients);

    if (clientValues.length === 1) {
      return clientValues[0];
    }
  }
}

export { ClientRegistry };