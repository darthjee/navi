import axios from 'axios';

/**
 * Test utility for stubbing axios HTTP requests.
 */
class AxiosUtils {
  /**
   * Stubs axios.get to resolve with the given status and optional data.
   * @param {number} status - The HTTP status code.
   * @param {string} [data] - Optional response body string.
   * @returns {object} The response object, for use in assertions.
   */
  static stubGet(status, data = undefined) {
    const response = { status, ...(data !== undefined && { data }) };
    spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
    return response;
  }

  /**
   * Stubs axios.get to reject with the given error.
   * @param {*} error - The rejection value.
   */
  static stubGetRejection(error) {
    spyOn(axios, 'get').and.returnValue(Promise.reject(error));
  }
}

export { AxiosUtils };
