/**
 * ClientNotFound is a custom error class thrown when a requested client
 * cannot be found in config.
 * @author darthjee
 */
class ClientNotFound extends Error {
  constructor(clientName) {
    super(`Client "${clientName}" not found.`);
    this.name = 'ClientNotFound';
    this.clientName = clientName;
  }
}

export { ClientNotFound };
