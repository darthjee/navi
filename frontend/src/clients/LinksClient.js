class LinksClient {
  /**
   * Fetches configured links from the server.
   * @returns {Promise<Array<{url: string, text: string}>>} A promise resolving to an array of links.
   */
  static fetchLinks() {
    return fetch('/links.json')
      .then(LinksClient.#handleResponse)
      .then(LinksClient.#buildResponseHandler);
  }

  static #handleResponse(res) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static #buildResponseHandler(data) {
    return data.links ?? [];
  }
}

export default LinksClient;
