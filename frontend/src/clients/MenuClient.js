class MenuClient {
  /**
   * Fetches the configured internal menu entries from the server.
   * @returns {Promise<Array<{route: string, text: string}>>} A promise resolving to an array of menu entries.
   */
  static fetchEntries() {
    return fetch('/menu.json')
      .then(MenuClient.#handleResponse)
      .then(MenuClient.#buildResponseHandler);
  }

  static #handleResponse(res) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  static #buildResponseHandler(data) {
    return data.entries ?? [];
  }
}

export default MenuClient;
