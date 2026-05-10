import { AppConfig } from '../config/AppConfig.js';
import ContentHandlerExecutor from './ContentHandlerExecutor.js';

/**
 * Executes request-handling behaviour for collection routes, applying
 * pagination and setting PAGE, PAGE-SIZE, and PAGES response headers.
 */
class CollectionHandlerExecutor extends ContentHandlerExecutor {
  /**
   * Applies pagination to the result, sets pagination headers, and writes
   * the JSON response.
   * @param {Array} result
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

export default CollectionHandlerExecutor;
