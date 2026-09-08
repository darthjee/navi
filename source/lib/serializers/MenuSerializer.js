import { Serializer } from './Serializer.js';

/**
 * Serializes MenuEntry instances into plain menu-entry objects.
 * @augments Serializer
 * @author darthjee
 */
class MenuSerializer extends Serializer {
  /**
   * Serializes a single MenuEntry instance.
   * @param {import('../models/configs/MenuEntry.js').MenuEntry} entry - The entry to serialize.
   * @returns {{route: string, text: string}} Plain object representation of the entry.
   */
  static _serializeObject(entry) {
    return entry.toJSON();
  }
}

export { MenuSerializer };
