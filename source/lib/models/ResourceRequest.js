import { ActionsEnqueuer } from './ActionsEnqueuer.js';
import { AssetRequest } from './AssetRequest.js';
import { ResourceRequestAction } from './ResourceRequestAction.js';
import { JobRegistry as DefaultJobRegistry } from '../registry/JobRegistry.js';

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
   * @param {Array} [attributes.assets=[]] List of raw asset extraction rule objects.
   */
  constructor({ url, status, clientName, actions = [], assets = [] }) {
    this.url = url;
    this.status = status;
    this.#clientName = clientName;
    this.actions = ResourceRequestAction.fromList(actions);
    this.assets = AssetRequest.fromListObject(assets);
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
   * Enqueues one HtmlParseJob for this resource request's asset extraction rules.
   * @param {string} rawHtml The raw HTML response body string.
   * @param {object} [jobRegistry=JobRegistry] The job registry used to enqueue the HtmlParseJob.
   * @param {object} clientRegistry The client registry for URL resolution inside HtmlParseJob.
   * @returns {void}
   */
  enqueueAssets(rawHtml, jobRegistry = DefaultJobRegistry, clientRegistry) {
    jobRegistry.enqueue('HtmlParse', { rawHtml, assetRequests: this.assets, clientRegistry });
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
   * @param {string} [options.clientName] optional client name to assign to each ResourceRequest
   * @returns {Array<ResourceRequest>} list of ResourceRequest instances
   */
  static fromList(array, { clientName } = {}) {
    return array.map((attrs) => new ResourceRequest({ ...attrs, clientName }));
  }
}

export { ResourceRequest };

