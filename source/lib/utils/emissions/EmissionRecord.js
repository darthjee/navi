/**
 * Represents a single EmitJob emission with id, status, target and timestamp.
 * @author darthjee
 */
class EmissionRecord {
  #id;
  #status;
  #url;
  #method;
  #httpStatus;
  #error;
  #itemRef;
  #timestamp;

  /**
   * Creates a new EmissionRecord instance.
   * @param {number} id - Unique incremental identifier for this emission.
   * @param {object} params - Emission parameters.
   * @param {string} params.status - The emission status (`success`, `failed` or `dead`).
   * @param {string} params.url - The URL the emission targeted.
   * @param {string} params.method - The HTTP method used for the emission.
   * @param {number|null} [params.httpStatus=null] - The HTTP response status, when available.
   * @param {string|null} [params.error=null] - The error message, when the emission failed.
   * @param {string|null} [params.itemRef=null] - A compact reference to the emitted item.
   */
  constructor(id, { status, url, method, httpStatus = null, error = null, itemRef = null }) {
    this.#id = id;
    this.#status = status;
    this.#url = url;
    this.#method = method;
    this.#httpStatus = httpStatus;
    this.#error = error;
    this.#itemRef = itemRef;
    this.#timestamp = new Date();
  }

  /**
   * Gets the emission ID.
   * @returns {number} The emission ID.
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets the emission status.
   * @returns {string} The emission status.
   */
  get status() {
    return this.#status;
  }

  /**
   * Gets the emission URL.
   * @returns {string} The emission URL.
   */
  get url() {
    return this.#url;
  }

  /**
   * Gets the emission HTTP method.
   * @returns {string} The emission HTTP method.
   */
  get method() {
    return this.#method;
  }

  /**
   * Gets the emission HTTP response status.
   * @returns {number|null} The HTTP response status or null.
   */
  get httpStatus() {
    return this.#httpStatus;
  }

  /**
   * Gets the emission error message.
   * @returns {string|null} The error message or null.
   */
  get error() {
    return this.#error;
  }

  /**
   * Gets the compact reference to the emitted item.
   * @returns {string|null} The item reference or null.
   */
  get itemRef() {
    return this.#itemRef;
  }

  /**
   * Gets the emission timestamp.
   * @returns {Date} The timestamp when the emission was recorded.
   */
  get timestamp() {
    return this.#timestamp;
  }

  /**
   * Converts the emission to a plain object.
   * @returns {object} Plain object representation of the emission.
   */
  toJSON() {
    return {
      id: this.#id,
      status: this.#status,
      url: this.#url,
      method: this.#method,
      httpStatus: this.#httpStatus,
      error: this.#error,
      itemRef: this.#itemRef,
      timestamp: this.#timestamp.toISOString()
    };
  }
}

export { EmissionRecord };
