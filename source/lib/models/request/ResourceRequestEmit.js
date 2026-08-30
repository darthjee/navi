import { ClientReference } from './ClientReference.js';
import { InvalidEmitCooldown } from '../../exceptions/config/InvalidEmitCooldown.js';
import { InvalidEmitHeaders } from '../../exceptions/config/InvalidEmitHeaders.js';
import { InvalidEmitMethod } from '../../exceptions/config/InvalidEmitMethod.js';
import { InvalidEmitRetries } from '../../exceptions/config/InvalidEmitRetries.js';
import { MissingEmitUrl } from '../../exceptions/config/MissingEmitUrl.js';

/**
 * The value types accepted for an individual `emit.headers` entry.
 * @type {Array<string>}
 */
const HEADER_VALUE_TYPES = ['string', 'number', 'boolean'];

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
  #retries;
  #cooldown;
  #headers;

  /**
   * @param {object} attributes ResourceRequestEmit attributes.
   * @param {string|{name: string, namespace: string}} [attributes.client] The client to use
   * for this emit: either the bare client name (shorthand), or an object with an explicit
   * target `namespace`.
   * @param {string} attributes.method The HTTP method used for the emit request. Must be
   * one of "POST", "PUT", "PATCH".
   * @param {string} attributes.url The URL to emit the request to.
   * @param {number} [attributes.status] The expected status code of the emit response.
   * @param {number} [attributes.retries] The maximum number of retries for this emit,
   * overriding EmitJob's own default. Must be a non-negative number when given.
   * @param {number} [attributes.cooldown] The cooldown, in milliseconds, applied between
   * retries for this emit, overriding EmitJob's own default. Must be a non-negative
   * number when given.
   * @param {object} [attributes.headers] A map of extra HTTP headers to send with this
   * emit request, merged over the client's own headers. Values must be string-coercible
   * (string, number, or boolean). Defaults to an empty object when omitted.
   */
  constructor({ client, method, url, status, retries, cooldown, headers }) {
    if (!EMIT_METHODS.includes(method)) throw new InvalidEmitMethod(method);
    if (!url) throw new MissingEmitUrl();
    if (retries !== undefined && (typeof retries !== 'number' || retries < 0)) throw new InvalidEmitRetries(retries);
    if (cooldown !== undefined && (typeof cooldown !== 'number' || cooldown < 0)) throw new InvalidEmitCooldown(cooldown);

    const parsedClient = ClientReference.parse(client);
    this.#clientName = parsedClient.name;
    this.#clientNamespace = parsedClient.namespace;
    this.#retries = retries;
    this.#cooldown = cooldown;
    this.#headers = this.#parseHeaders(headers);

    this.method = method;
    this.url = url;
    this.status = status;
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
   * Returns the maximum number of retries configured for this emit, or undefined
   * when not set, letting EmitJob apply its own default.
   * @returns {number|undefined} The configured retries, or undefined.
   */
  get retries() {
    return this.#retries;
  }

  /**
   * Returns the cooldown, in milliseconds, configured for this emit, or undefined
   * when not set, letting EmitJob apply its own default.
   * @returns {number|undefined} The configured cooldown, or undefined.
   */
  get cooldown() {
    return this.#cooldown;
  }

  /**
   * Returns the map of extra HTTP headers configured for this emit. Always an object;
   * an empty object when no headers were configured.
   * @returns {object} The configured headers map.
   */
  get headers() {
    return this.#headers;
  }

  /**
   * Returns the URL with every {:placeholder} token replaced by the
   * corresponding value from the parameters object.
   * Tokens with no matching key are left unchanged.
   * @param {object} [parameters={}] Key-value map of URL parameters.
   * @returns {string} The resolved URL.
   */
  resolveUrl(parameters = {}) {
    return this.url.replace(/\{:(\w+)\}/g, (_, key) => parameters[key] ?? `{:${key}}`);
  }

  /**
   * Validates and normalises the raw `headers` config value.
   * @param {object} [headers] The raw headers map from config.
   * @returns {object} The validated headers map, or an empty object when none was given.
   * @throws {InvalidEmitHeaders} When headers is not a plain object of string-coercible values.
   */
  #parseHeaders(headers) {
    if (headers === undefined) return {};
    if (headers === null || typeof headers !== 'object' || Array.isArray(headers)) {
      throw new InvalidEmitHeaders(headers);
    }

    for (const value of Object.values(headers)) {
      if (!HEADER_VALUE_TYPES.includes(typeof value)) throw new InvalidEmitHeaders(headers);
    }

    return headers;
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
