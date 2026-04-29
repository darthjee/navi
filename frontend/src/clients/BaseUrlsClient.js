/**
 * Fetches the list of unique client base URLs from the server.
 * @returns {Promise<string[]>} A promise resolving to an array of base URL strings.
 */
const fetchBaseUrls = () => {
  return fetch('/clients/base_urls.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => data.base_urls ?? []);
};

export default fetchBaseUrls;
