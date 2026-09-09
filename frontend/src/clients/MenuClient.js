class MenuClient {
  /**
   * Fetches the configured internal menu from the server.
   * @returns {Promise<{entries: Array<{route: string, text: string}>, hidden: string[]}>}
   *   A promise resolving to the menu entries plus the list of routes the
   *   operator hid from the extension menu merge.
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
    return {
      entries: data.entries ?? [],
      hidden: data.hidden ?? [],
    };
  }
}

export default MenuClient;
