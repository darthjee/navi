import { Client } from '../../../lib/client/Client.js';

/**
 * Factory for creating Client instances in tests.
 */
class ClientFactory {
  /**
   * Builds a Client instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.name='default'] - The client name.
   * @param {string} [params.baseUrl='https://example.com'] - The base URL.
   * @param {string|null} [params.linkText=null] - Optional display text for links.
   * @param {number} [params.timeout] - Optional request timeout in milliseconds.
   * @param {object} [params.headers] - Optional HTTP headers.
   * @param {string} [params.namespace='default'] - The namespace this client was declared in.
   * @returns {Client} A new Client instance.
   */
  static build({ name = 'default', baseUrl = 'https://example.com', linkText = null, timeout, headers, namespace = 'default' } = {}) {
    return new Client({ name, baseUrl, linkText, timeout, headers, namespace });
  }
}

export { ClientFactory };
