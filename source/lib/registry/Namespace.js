import { ClientRegistry } from './ClientRegistry.js';
import { ResourceRegistry } from './ResourceRegistry.js';

/**
 * Namespace groups together the resources and clients contributed by one or more
 * configuration files sharing the same `namespace` name.
 *
 * `resourceRegistry`/`clientRegistry` are plain instances (not the static singleton
 * facade) of the existing `ResourceRegistry`/`ClientRegistry` classes.
 * @author darthjee
 */
class Namespace {
  /**
   * @param {object} attributes Namespace attributes.
   * @param {string} attributes.name The namespace name.
   * @param {Record<string, Resource>} [attributes.resources={}] Resources declared in this namespace.
   * @param {Record<string, Client>} [attributes.clients={}] Clients declared in this namespace.
   */
  constructor({ name, resources = {}, clients = {} }) {
    this.name = name;
    this.resourceRegistry = new ResourceRegistry(resources);
    this.clientRegistry = new ClientRegistry(clients);
  }
}

export { Namespace };
