import { InvalidEmitMethod } from '../../exceptions/config/InvalidEmitMethod.js';
import { MissingEmitUrl } from '../../exceptions/config/MissingEmitUrl.js';
import { ClientReference } from './ClientReference.js';

/**
 * The set of supported `emit.method` values.
 * @type {Array<string>}
 */
const EMIT_METHODS = ['POST', 'PUT', 'PATCH'];

/**
 * ResourceRequestEmit represents a resource request's declared "emit" action: a follow-up
 * HTTP call made with data collected while crawling. `client`, `method`, and `url` are all
 * validated eagerly at construction time.
 * @author darthjee
 */
class ResourceRequestEmit {
  #clientName;
  #clientNamespace;

  /**
   * @param {object} attributes ResourceRequestEmit attributes.
   * @param {string|{name: string, namespace: string}} [attributes.client] The client to use
   * for this emit: either the bare client name (shorthand), or an object with an explicit
   * target `namespace`.
   * @param {string} attributes.method The HTTP method used for the emit request. Must be
   * one of "POST", "PUT", "PATCH".
   * @param {string} attributes.url The URL to emit the request to.
   */
  constructor({ client, method, url }) {
    if (!EMIT_METHODS.includes(method)) throw new InvalidEmitMethod(method);
    if (!url) throw new MissingEmitUrl();

    const parsedClient = ClientReference.parse(client);
    this.#clientName = parsedClient.name;
    this.#clientNamespace = parsedClient.namespace;

    this.method = method;
    this.url = url;
  }

  /**
   * Returns the name of the client associated with this emit.
   * @returns {string|undefined} The client name, or undefined if not set.
   */
  get clientName() {
    return this.#clientName;
  }

  /**
   * Returns the explicit target namespace of the client associated with this emit,
   * or null when not given.
   * @returns {string|null} The client's target namespace, or null when not explicitly set.
   */
  get clientNamespace() {
    return this.#clientNamespace;
  }

  /**
   * Creates a ResourceRequestEmit instance from a plain config object.
   * @param {object} obj Raw config object.
   * @returns {ResourceRequestEmit} A new ResourceRequestEmit instance.
   */
  static fromObject(obj) {
    return new ResourceRequestEmit(obj);
  }
}

export { ResourceRequestEmit, EMIT_METHODS };
