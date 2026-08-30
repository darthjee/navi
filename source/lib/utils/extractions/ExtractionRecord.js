/**
 * Represents a single ExtractionJob run with id, parser type, origin URL, item count
 * and timestamp.
 * @author darthjee
 */
class ExtractionRecord {
  #id;
  #parserType;
  #originUrl;
  #itemCount;
  #timestamp;

  /**
   * Creates a new ExtractionRecord instance.
   * @param {number} id - Unique incremental identifier for this extraction.
   * @param {object} params - Extraction parameters.
   * @param {string} params.parserType - The parser type that produced the items.
   * @param {string|null} [params.originUrl=null] - The URL that triggered the extraction.
   * @param {number} [params.itemCount=0] - The number of items produced by the extraction.
   */
  constructor(id, { parserType, originUrl = null, itemCount = 0 }) {
    this.#id = id;
    this.#parserType = parserType;
    this.#originUrl = originUrl;
    this.#itemCount = itemCount;
    this.#timestamp = new Date();
  }

  /**
   * Gets the extraction ID.
   * @returns {number} The extraction ID.
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets the parser type.
   * @returns {string} The parser type.
   */
  get parserType() {
    return this.#parserType;
  }

  /**
   * Gets the origin URL that triggered the extraction.
   * @returns {string|null} The origin URL or null.
   */
  get originUrl() {
    return this.#originUrl;
  }

  /**
   * Gets the number of items produced by the extraction.
   * @returns {number} The item count.
   */
  get itemCount() {
    return this.#itemCount;
  }

  /**
   * Gets the extraction timestamp.
   * @returns {Date} The timestamp when the extraction was recorded.
   */
  get timestamp() {
    return this.#timestamp;
  }

  /**
   * Converts the extraction to a plain object.
   * @returns {object} Plain object representation of the extraction.
   */
  toJSON() {
    return {
      id: this.#id,
      parserType: this.#parserType,
      originUrl: this.#originUrl,
      itemCount: this.#itemCount,
      timestamp: this.#timestamp.toISOString()
    };
  }
}

export { ExtractionRecord };
