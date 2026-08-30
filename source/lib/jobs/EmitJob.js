import { Job } from 'deku-swarm';
import { RequestFailed } from '../exceptions/request/RequestFailed.js';

/**
 * The set of HTTP status codes considered retryable by EmitJob's default policy:
 * any 5xx server error, 429 (Too Many Requests), and 408 (Request Timeout).
 * @param {number} statusCode The HTTP status code to check.
 * @returns {boolean} True when the status code is retryable.
 */
const isRetryableStatus = (statusCode) => (statusCode >= 500 && statusCode < 600) || statusCode === 429 || statusCode === 408;

/**
 * EmitJob is a Job that sends a single extracted item to an external endpoint, as
 * declared by a resource request's `emit` configuration.
 *
 * Unlike other job classes, EmitJob defines its own retry policy — distinct from the
 * global `workersConfig` policy — overridable per resource via `emit.retries`/`emit.cooldown`,
 * that skips retrying non-retryable 4xx failures and honors a capped `Retry-After` header
 * on HTTP 429 responses.
 * @author darthjee
 */
class EmitJob extends Job {
  /**
   * The default maximum number of retries for an EmitJob, when the resource's
   * `emit.retries` is not set.
   * @type {number}
   */
  static DEFAULT_MAX_RETRIES = 5;

  /**
   * The default cooldown, in milliseconds, applied between EmitJob retries, when the
   * resource's `emit.cooldown` is not set.
   * @type {number}
   */
  static DEFAULT_COOLDOWN = 5000;

  /**
   * The maximum cooldown, in milliseconds, honored from a `Retry-After` response header.
   * @type {number}
   */
  static RETRY_AFTER_CAP_MS = 60000;

  #item;
  #emit;
  #parameters;
  #clients;
  #maxRetries;
  #cooldown;

  /**
   * Creates a new EmitJob instance.
   * @param {object} params - The parameters for creating an EmitJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ExtractedItem} params.item - The extracted item to send, a single element of a
   * parser's `extract()` output array.
   * @param {ResourceRequestEmit} params.emit - The resource request's declared emit configuration.
   * @param {object} [params.parameters] - Key-value map used to resolve {:placeholder} tokens
   * in the emit URL.
   * @param {NamespaceMap} params.clients - The namespace map used to resolve the client for this emit.
   */
  constructor({ id, item, emit, parameters, clients }) {
    super({ id });
    this.#item = item;
    this.#emit = emit;
    this.#parameters = parameters;
    this.#clients = clients;
    this.#maxRetries = emit.retries ?? EmitJob.DEFAULT_MAX_RETRIES;
    this.#cooldown = emit.cooldown ?? EmitJob.DEFAULT_COOLDOWN;
  }

  /**
   * Returns the effective maximum number of retries for this job.
   * When the last error is a non-retryable HTTP failure (any 4xx other than 429/408),
   * forces immediate exhaustion by returning the current attempt count. A network-level
   * error (not a RequestFailed) is always retryable.
   * @returns {number} The maximum number of retries.
   */
  get maxRetries() {
    if (this.lastError instanceof RequestFailed && !isRetryableStatus(this.lastError.statusCode)) {
      return this._attempts;
    }

    return this.#maxRetries;
  }

  /**
   * Returns the effective cooldown, in milliseconds, to apply before the next retry.
   * When the last error is a 429 RequestFailed carrying a parseable numeric `Retry-After`
   * header (delta-seconds form), returns that value in milliseconds, capped at
   * `RETRY_AFTER_CAP_MS`. Otherwise returns the configured/default cooldown.
   * @returns {number} The cooldown in milliseconds.
   */
  get cooldown() {
    const retryAfterMs = this.#retryAfterMs();

    if (retryAfterMs !== undefined) {
      return Math.min(retryAfterMs, EmitJob.RETRY_AFTER_CAP_MS);
    }

    return this.#cooldown;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * The URL is fully resolved with all parameter placeholders substituted.
   * @returns {{ url: string, method: string }} The job arguments.
   */
  get arguments() {
    return { url: this.#emit.resolveUrl(this.#parameters), method: this.#emit.method };
  }

  /**
   * Emits the extracted item to the configured external endpoint.
   * @param {LogContext} logContext - Context carrying workerId/jobId for log entries.
   * @returns {Promise<object>} A promise that resolves with the HTTP response.
   */
  async perform(logContext) {
    logContext.debug(`EmitJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      const url = this.#emit.resolveUrl(this.#parameters);
      const response = await this.#getClient().emit(
        this.#emit.method, url, this.#item, this.#emit.status, logContext, this.#emit.headers,
      );
      return response;
    } catch (error) {
      logContext.error(`EmitJob #${this.id} failed: ${error}`);
      this._fail(error);
    }
  }

  /**
   * Gets the client associated with this job's emit configuration.
   * @returns {Client} The client associated with this job's emit configuration.
   * @private
   */
  #getClient() {
    return this.#clients.getClient('default', this.#emit.clientName, this.#emit.clientNamespace);
  }

  /**
   * Reads and parses a `Retry-After` header, in delta-seconds form, from the last error,
   * when it is a 429 RequestFailed.
   * @returns {number|undefined} The parsed Retry-After delay in milliseconds, or undefined
   * when there is none, or it isn't a parseable delta-seconds value.
   * @private
   */
  #retryAfterMs() {
    if (!(this.lastError instanceof RequestFailed) || this.lastError.statusCode !== 429) return undefined;

    const headers = this.lastError.headers || {};
    const retryAfter = headers['retry-after'] ?? headers['Retry-After'];

    if (!/^\d+$/.test(String(retryAfter))) return undefined;

    return Number(retryAfter) * 1000;
  }
}

export { EmitJob };
