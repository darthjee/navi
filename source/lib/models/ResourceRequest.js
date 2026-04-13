import { ActionsEnqueuer } from './ActionsEnqueuer.js';
import { ResourceRequestAction } from './ResourceRequestAction.js';

/**
 * ResourceRequest represents a request to a specific URL with an expected status code.
 * @author darthjee
 */
class ResourceRequest {
  #clientName;

  /**
   * @param {object} attributes ResourceRequest attributes
   * @param {string} attributes.url The URL to request.
   * @param {number} attributes.status The expected status code of the response.
   * @param {string} [attributes.clientName] The name of the client to use for this request.
   * @param {Array} [attributes.actions=[]] List of raw action config objects.
   */
  constructor({ url, status, clientName, actions = [] }) {
    this.url = url;
    this.status = status;
    this.#clientName = clientName;
    this.actions = ResourceRequestAction.fromList(actions);
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
   * Enqueues one ActionProcessingJob per action associated with the resource request.
   * Returns immediately if there are no actions.
   * @param {ResponseWrapper} responseWrapper The ResponseWrapper for the HTTP response.
   * @returns {void}
   */
  enqueueActions(responseWrapper) {
    if (this.actions.length === 0) return;

    const itemWrappers = responseWrapper.toItemWrappers();
    new ActionsEnqueuer(this.actions, itemWrappers).enqueue();
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
   * @param {string} [options.clientName] optional client name to assign to each ResourceRequest
   * @returns {Array<ResourceRequest>} list of ResourceRequest instances
   */
  static fromList(array, { clientName } = {}) {
    return array.map((attrs) => new ResourceRequest({ ...attrs, clientName }));
  }
}

export { ResourceRequest };

