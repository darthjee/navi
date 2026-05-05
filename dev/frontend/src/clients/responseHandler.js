/**
 * Handles a fetch response, extracting JSON data and pagination headers.
 * Throws an error for non-OK responses.
 *
 * @param {Response} res - The fetch Response object.
 * @returns {Promise<{data: *, pagination: {page: number, pageSize: number, pages: number}}>}
 */
export const handleResponse = (res) => {
  if (!res.ok) return Promise.reject(new Error(`HTTP ${res.status}`));

  return res.json().then((data) => ({
    data,
    pagination: {
      page: Number(res.headers.get('PAGE')),
      pageSize: Number(res.headers.get('PAGE-SIZE')),
      pages: Number(res.headers.get('PAGES')),
    },
  }));
};
