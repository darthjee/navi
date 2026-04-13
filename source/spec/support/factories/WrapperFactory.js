/**
 * Factory for creating plain wrapper objects in tests.
 * Simulates the shape of ResponseWrapper (parsedBody + headers).
 */
class WrapperFactory {
  /**
   * Builds a wrapper object.
   * @param {object} [params={}] - Optional attributes.
   * @param {object} [params.parsedBody={ id: 1 }] - The parsed response body.
   * @param {object} [params.headers={}] - The response headers.
   * @param {object} [params.parameters] - Optional parameters carried by the item.
   * @returns {object} A plain wrapper object.
   */
  static build({ parsedBody = { id: 1 }, headers = {}, parameters = undefined } = {}) {
    const wrapper = { parsedBody, headers };
    if (parameters !== undefined) wrapper.parameters = parameters;
    return wrapper;
  }
}

export { WrapperFactory };
