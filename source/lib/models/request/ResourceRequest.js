import { JobRegistry as DefaultJobRegistry } from 'deku-swarm';
import { AssetRequest } from './AssetRequest.js';
import { ResourceRequestAction } from './ResourceRequestAction.js';
import { ResourceRequestPaginatedAction } from './ResourceRequestPaginatedAction.js';
import { ActionsEnqueuer } from '../../enqueuers/ActionsEnqueuer.js';
import { PaginatedActionsEnqueuer } from '../../enqueuers/PaginatedActionsEnqueuer.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { Application } from '../../services/Application.js';

/**
 * ResourceRequest represents a request to a specific URL with an expected status code.
 * @author darthjee
 */
class ResourceRequest {
  #clientName;
  #clientNamespace;
  #namespace;
  #disabled;
  #maxPage;

  /**
   * @param {object} attributes ResourceRequest attributes
   * @param {string} attributes.url The URL to request.
   * @param {number} attributes.status The expected status code of the response.
   * @param {string|{name: string, namespace: string}} [attributes.clientName] The client to use for this
   * request: either the bare client name (shorthand), or an object with an explicit target `namespace`.
   * @param {string} [attributes.namespace='default'] The namespace of the Resource that owns this request.
   * @param {Array} [attributes.actions=[]] List of raw action config objects.
   * @param {Array} [attributes.assets=[]] List of raw asset extraction rule objects.
   * @param {Array} [attributes.paginated_actions=[]] List of raw paginated action config objects.
   * @param {boolean} [attributes.enabled] Whether this request is enabled. Defaults to enabled
   * when omitted. Ignored when `disabled` is `true`.
   * @param {boolean} [attributes.disabled] Whether this request is disabled. Takes precedence
   * over `enabled` when `true`.
   * @param {number} [attributes.max_page] Caps how many pages of this resource are ever enqueued
   * when it's the target of another resource's `paginated_actions`. Must be a positive integer;
   * any other value (including omitted, `null`, or `0`) means unlimited.
   */
  constructor({
    url,
    status,
    clientName,
    namespace = 'default',
    actions = [],
    assets = [],
    paginated_actions = [],
    enabled,
    disabled,
    max_page,
  }) {
    this.url = url;
    this.status = status;
    this.#namespace = namespace;
    this.#disabled = disabled === true || enabled === false;
    this.#maxPage = this.#sanitizeMaxPage(max_page);

    const parsedClient = ResourceRequest.#parseClient(clientName);
    this.#clientName = parsedClient.name;
    this.#clientNamespace = parsedClient.namespace;

    this.actions = ResourceRequestAction.fromList(actions, { originNamespace: namespace });
    this.assets = AssetRequest.fromListObject(assets);
    this.paginatedActions = ResourceRequestPaginatedAction.fromList(paginated_actions, { originNamespace: namespace });
  }

  /**
   * Returns the name of the client associated with this request,
   * as inherited from the parent Resource's client attribute.
   * @returns {string|undefined} The client name, or undefined if not set.
   */
  get clientName() {
    return this.#clientName;
  }

  /**
   * Returns the explicit target namespace of the client associated with this request,
   * as inherited from the parent Resource's client attribute, or null when not given.
   * @returns {string|null} The client's target namespace, or null when not explicitly set.
   */
  get clientNamespace() {
    return this.#clientNamespace;
  }

  /**
   * Returns the namespace of the Resource that owns this request.
   * @returns {string} The owning resource's namespace.
   */
  get namespace() {
    return this.#namespace;
  }

  /**
   * Returns whether this resource request is disabled, i.e. it must not be enqueued
   * through any path (startup, manual trigger, or chained actions). A request is
   * disabled when `disabled: true` was given (regardless of `enabled`), or when
   * `enabled: false` was given. Otherwise it is enabled (the default).
   * @returns {boolean} True if the request is disabled.
   */
  get disabled() {
    return this.#disabled;
  }

  /**
   * Returns the cap on how many pages of this resource are ever enqueued when it's the
   * target of another resource's `paginated_actions`. `null` means unlimited.
   * @returns {number|null} The positive integer cap, or null when unlimited.
   */
  get maxPage() {
    return this.#maxPage;
  }

  /**
   * Enqueues one ActionProcessingJob per action associated with the resource request.
   * Returns immediately if there are no actions.
   * @param {ResponseWrapper} responseWrapper The ResponseWrapper for the HTTP response.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   * @returns {void}
   */
  enqueueActions(responseWrapper, originUrl = null) {
    if (this.actions.length === 0) return;

    const itemWrappers = responseWrapper.toItemWrappers();
    new ActionsEnqueuer(this.actions, itemWrappers, undefined, originUrl).enqueue();
  }

  /**
   * Enqueues one PaginatedActionProcessingJob per paginated action.
   * Returns immediately if there are no paginated actions.
   * @param {ResponseWrapper} responseWrapper The ResponseWrapper for the HTTP response.
   * @param {object} [parameters={}] The original request parameters (key-value map for URL template resolution).
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   * @returns {void}
   */
  enqueuePaginatedActions(responseWrapper, parameters = {}, originUrl = null) {
    if (this.paginatedActions.length === 0) return;

    new PaginatedActionsEnqueuer(this.paginatedActions, responseWrapper, parameters, undefined, originUrl).enqueue();
  }

  /**
   * Enqueues one HtmlParseJob for this resource request's asset extraction rules.
   * Does nothing if the application is in 'stopped' status.
   * @param {string} rawHtml The raw HTML response body string.
   * @param {object} [jobRegistry=JobRegistry] The job registry used to enqueue the HtmlParseJob.
   * @param {object} clientRegistry The client registry for URL resolution inside HtmlParseJob.
   * @param {string|null} [originUrl=null] The URL of the ResourceRequestJob that triggered this enqueue.
   * @returns {void}
   */
  enqueueAssets(rawHtml, jobRegistry = DefaultJobRegistry, clientRegistry, originUrl = null) {
    if (Application.isStopped()) return;
    const params = { rawHtml, assetRequests: this.assets, clientRegistry };
    if (originUrl !== null) params.originUrl = originUrl;
    jobRegistry.enqueue('HtmlParse', params);
  }

  /**
   * Returns true when the resource request has at least one asset extraction rule.
   * @returns {boolean} True if assets are configured.
   */
  hasAssets() {
    return this.assets.length > 0;
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
   * Returns true if the URL template contains any {:placeholder} tokens,
   * indicating that parameter substitution is required before the request can be made.
   * @returns {boolean} true if the URL requires parameters, false otherwise.
   */
  needsParams() {
    return /\{:\w+\}/.test(this.url);
  }

  /**
   * Creates a list of ResourceRequest instances from an array of objects.
   * @param {Array<{ url: string, status: number }>} array list of objects with attributes to create a new ResourceRequest
   * @param {object} [options={}] optional options to assign to each ResourceRequest
   * @param {string|{name: string, namespace: string}} [options.clientName] optional client reference
   * to assign to each ResourceRequest.
   * @param {string} [options.namespace='default'] the namespace of the owning Resource.
   * @returns {Array<ResourceRequest>} list of ResourceRequest instances
   */
  static fromList(array, { clientName, namespace = 'default' } = {}) {
    return array.map((attrs) => new ResourceRequest({ ...attrs, clientName, namespace }));
  }

  /**
   * Parses a raw client reference into a name/namespace pair.
   * Accepts either a bare string (shorthand, resolved in the requester's own namespace)
   * or an object with an explicit target `namespace`.
   * @param {string|{name: string, namespace: string}} [client] The raw client reference.
   * @returns {{name: string|undefined, namespace: string|null}} The parsed client name and target namespace.
   */
  static #parseClient(client) {
    if (client && typeof client === 'object') {
      return { name: client.name, namespace: client.namespace ?? null };
    }
    return { name: client, namespace: null };
  }

  /**
   * Sanitizes the raw `max_page` value into a positive integer or `null`.
   * Logs a warning when a present value is invalid.
   * @param {*} value The raw `max_page` value.
   * @returns {number|null} The sanitized positive integer, or null when unlimited.
   */
  #sanitizeMaxPage(value) {
    if (value === undefined || value === null || value === 0) return null;
    if (Number.isInteger(value) && value > 0) return value;

    LogRegistry.warn(`Ignoring invalid max_page value: ${JSON.stringify(value)} — treating as unlimited`);
    return null;
  }
}

export { ResourceRequest };

