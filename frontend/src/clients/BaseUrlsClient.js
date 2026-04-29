class BaseUrlsClient {
  /**
   * Fetches the list of unique client base URLs from the server.
   * @returns {Promise<string[]>} A promise resolving to an array of base URL strings.
   */
  static fetchBaseUrls() {
    return fetch('/clients/base_urls.json')
      .then(BaseUrlsClient.#handleResponse)
      .then(BaseUrlsClient.#buildResponseHandler);
  }

  static #handleResponse(res) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static #buildResponseHandler(data) {
    return data.base_urls ?? [];
  }
}

export default BaseUrlsClient;
