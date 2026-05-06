import ContentHandler from './ContentHandler.js';
import { AppConfig } from '../config/AppConfig.js';

/**
 * Handles collection endpoints by applying pagination logic and setting
 * `PAGE`, `PAGE-SIZE`, and `PAGES` response headers.
 *
 * Extends {@link ContentHandler} and overrides the response step to slice
 * the result set according to `page` and `page_size` query parameters.
 * Unparseable parameter values fall back to defaults:
 * - `page` defaults to `1`
 * - `page_size` defaults to `AppConfig.json.pageSize`
 *
 * When `page` is out of range an empty array is returned.
 */
class CollectionHandler extends ContentHandler {
  /**
   * Applies pagination to the navigation result, sets pagination headers,
   * and writes the JSON response.
   *
   * @param {Array} result - The full navigation result array.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  _respond(result, req, res) {
    const rawPageSize = parseInt(req.query.page_size, 10);
    const rawPage = parseInt(req.query.page, 10);

    const pageSize = Number.isNaN(rawPageSize) ? AppConfig.json.pageSize : rawPageSize;
    const page = Number.isNaN(rawPage) ? 1 : rawPage;

    const serialized = this._serializer ? this._serializer.serialize(result) : result;
    const totalPages = Math.ceil(serialized.length / pageSize);
    const start = (page - 1) * pageSize;
    const pageData = serialized.slice(start, start + pageSize);

    res.set('PAGE', String(page));
    res.set('PAGE-SIZE', String(pageSize));
    res.set('PAGES', String(totalPages));
    res.json(pageData);
  }
}

export default CollectionHandler;
