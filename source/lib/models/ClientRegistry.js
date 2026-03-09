import { ClientNotFound } from '../exceptions/ClientNotFound.js';

class ClientRegistry {
  constructor(clients) {
    this.clients = clients;
  }
  
  getClient(name) {
    return this.#fetchClient(name) || this.#getDefaultClient();
  }

  #getDefaultClient() {
    return this.#fetchDefaultClient() || this.#fetchClient('default') || this.#clientNotFound('default');
  }

  #fetchClient(name) {
    if (name in this.clients) {
      return this.clients[name];
    }

    if (name && name !== 'default') {
      this.#clientNotFound(name);
    }
  }

  #clientNotFound(name) {
    throw new ClientNotFound(name);
  }

  #fetchDefaultClient() {
    const clientValues = Object.values(this.clients);

    if (clientValues.length === 1) {
      return clientValues[0];
    }
  }
}

export { ClientRegistry };