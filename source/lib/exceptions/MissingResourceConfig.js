import { MissingTopLevelConfigKey } from './MissingTopLevelConfgKey.js';

/**
 * ItemNotFound is a custom error class thrown when a requested item
 * cannot be found.
 * @author darthjee
 */
class MissingResourceConfig extends MissingTopLevelConfigKey {
  constructor() {
    super('resources');
  }
}

export { MissingResourceConfig };
