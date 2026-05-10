import { Serializer } from './Serializer.js';

/**
 * Serializes Link instances into plain link objects.
 * @augments Serializer
 * @author darthjee
 */
class LinksSerializer extends Serializer {
  /**
   * Serializes a single Link instance.
   * @param {import('../models/configs/Link.js').Link} link - The link to serialize.
   * @returns {{url: string, text: string}} Plain object representation of the link.
   */
  static _serializeObject(link) {
    return link.toJSON();
  }
}

export { LinksSerializer };
