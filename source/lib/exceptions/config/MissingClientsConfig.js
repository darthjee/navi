import { MissingTopLevelConfigKey } from './MissingTopLevelConfgKey.js';

/**
 * ItemNotFound is a custom error class thrown when a requested item
 * cannot be found.
 * @author darthjee
 */
class MissingClientsConfig extends MissingTopLevelConfigKey {
  constructor() {
    super('clients');
  }
}

export { MissingClientsConfig };
