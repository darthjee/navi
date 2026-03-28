import { Client } from '../../../lib/services/Client.js';

/**
 * Factory for creating Client instances in tests.
 */
class ClientFactory {
  /**
   * Builds a Client instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.name='default'] - The client name.
   * @param {string} [params.baseUrl='https://example.com'] - The base URL.
   * @returns {Client} A new Client instance.
   */
  static build({ name = 'default', baseUrl = 'https://example.com' } = {}) {
    return new Client({ name, baseUrl });
  }
}

export { ClientFactory };
