import { BodyTemplateRenderer } from './BodyTemplateRenderer.js';
import { ClientReference } from './ClientReference.js';
import { UrlTokenResolver } from './UrlTokenResolver.js';
import { InvalidEmitBodyTemplate } from '../../exceptions/config/InvalidEmitBodyTemplate.js';
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
  #bodyTemplate;

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
   * @param {object|Array} [attributes.body_template] A plain object or array template used
   * to wrap/re-shape the extracted item before it is sent as the emit request body. `{:key}`
   * / `{:nested.path}` tokens are resolved against the item; `{:.}` refers to the whole item.
   * When omitted, the bare item is sent as the body (current behavior).
   */
  constructor({ client, method, url, status, retries, cooldown, headers, body_template: bodyTemplate }) {
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
    this.#bodyTemplate = this.#parseBodyTemplate(bodyTemplate);

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
   * Returns the configured body template, or undefined when no template was configured.
   * @returns {object|Array|undefined} The configured body template.
   */
  get bodyTemplate() {
    return this.#bodyTemplate;
  }

  /**
   * Returns the URL with every {:placeholder} token replaced by the
   * corresponding value from the parameters object.
   * Tokens with no matching key are left unchanged.
   * @param {object} [parameters={}] Key-value map of URL parameters.
   * @returns {string} The resolved URL.
   */
  resolveUrl(parameters = {}) {
    return UrlTokenResolver.resolve(this.url, parameters);
  }

  /**
   * Returns the emit request body for the given item, rendered through the configured
   * `bodyTemplate` when one was given, or the bare item unchanged when it wasn't.
   * @param {*} item The extracted item to build the emit body from.
   * @returns {*} The resolved emit request body.
   */
  resolveBody(item) {
    if (this.#bodyTemplate === undefined) return item;

    return BodyTemplateRenderer.render(this.#bodyTemplate, item);
  }

  /**
   * Creates a ResourceRequestEmit instance from a plain config object.
   * @param {object} obj Raw config object.
   * @returns {ResourceRequestEmit} A new ResourceRequestEmit instance.
   */
  static fromObject(obj) {
    return new ResourceRequestEmit(obj);
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
   * Validates and normalises the raw `body_template` config value.
   * @param {object|Array} [bodyTemplate] The raw body template from config.
   * @returns {object|Array|undefined} The validated body template, or undefined when none
   * was given.
   * @throws {InvalidEmitBodyTemplate} When bodyTemplate is not a plain object or array.
   */
  #parseBodyTemplate(bodyTemplate) {
    if (bodyTemplate === undefined) return undefined;

    const isPlainArray = Array.isArray(bodyTemplate);
    const isPlainObject = bodyTemplate !== null && typeof bodyTemplate === 'object' && !isPlainArray
      && Object.getPrototypeOf(bodyTemplate) === Object.prototype;

    if (!isPlainArray && !isPlainObject) {
      throw new InvalidEmitBodyTemplate(bodyTemplate);
    }

    return bodyTemplate;
  }
}

export { ResourceRequestEmit, EMIT_METHODS };
