import { Job } from 'deku-swarm';

/**
 * ExtractionJob is a Job that extracts structured items from a raw response body
 * using a parser implementation resolved from a ParserRegistry.
 *
 * Unlike ResourceRequestJob, this job is exhausted after the first failure — it has no
 * retry rights, analogous to ActionProcessingJob/HtmlParseJob.
 * @author darthjee
 */
class ExtractionJob extends Job {
  #rawBody;
  #parser;
  #parserRegistry;
  #originUrl;

  /**
   * Creates a new ExtractionJob instance.
   * @param {object} params - The parameters for creating an ExtractionJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {string} params.rawBody - The raw HTTP response body to extract data from.
   * @param {ResourceRequestParser} params.parser - The resource's declared parser rule.
   * @param {object} params.parserRegistry - The registry used to resolve the parser implementation.
   * @param {string|null} [params.originUrl=null] - The URL of the ResourceRequestJob that triggered this job.
   */
  constructor({ id, rawBody, parser, parserRegistry, originUrl = null }) {
    super({ id });
    this.#rawBody = rawBody;
    this.#parser = parser;
    this.#parserRegistry = parserRegistry;
    this.#originUrl = originUrl;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * @returns {{ parserType: string, originUrl?: string }} The job arguments.
   */
  get arguments() {
    return { parserType: this.#parser.type, ...this.#originUrlField() };
  }

  /**
   * Returns the maximum number of retries for this job type.
   * ExtractionJob is exhausted after the first failure.
   * @returns {number} Always 1.
   * @override
   */
  get maxRetries() {
    return 1;
  }

  /**
   * Resolves the parser implementation and extracts items from the raw body, logging
   * the resulting items via `logContext.debug`.
   * @param {LogContext} logContext - Context carrying workerId/jobId for log entries.
   * @returns {Promise<void>}
   */
  async perform(logContext) {
    logContext.debug(`ExtractionJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      const parserImpl = this.#parserRegistry.getItem(this.#parser.type);
      const items = parserImpl.extract(this.#rawBody, this.#parser.attributes);
      logContext.debug(`ExtractionJob #${this.id} extracted ${items.length} item(s)`, { items });
    } catch (error) {
      this._fail(error);
    }
  }

  /**
   * Returns an object containing the originUrl field when an origin URL is set,
   * or an empty object otherwise.
   * @returns {{ originUrl: string }|{}} The origin URL field or empty object.
   * @private
   */
  #originUrlField() {
    return this.#originUrl !== null ? { originUrl: this.#originUrl } : {};
  }

}

export { ExtractionJob };
