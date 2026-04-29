import { Serializer } from './Serializer.js';

/**
 * Serializes a Client instance to its base URL string.
 * @author darthjee
 */
class BaseUrlsSerializer extends Serializer {
  /**
   * Extracts the baseUrl from a Client instance.
   * @param {object} client - The Client instance to serialize.
   * @returns {string} The client's base URL.
   */
  static _serializeObject(client) {
    return client.baseUrl;
  }
}

export { BaseUrlsSerializer };
