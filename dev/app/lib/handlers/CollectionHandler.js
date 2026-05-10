import CollectionHandlerExecutor from './CollectionHandlerExecutor.js';
import ContentHandler from './ContentHandler.js';

/**
 * Handles collection endpoints by applying pagination logic and setting
 * `PAGE`, `PAGE-SIZE`, and `PAGES` response headers.
 *
 * Extends {@link ContentHandler} and delegates to {@link CollectionHandlerExecutor}
 * which overrides the respond step to slice the result set according to
 * `page` and `page_size` query parameters.
 */
class CollectionHandler extends ContentHandler {
  /**
   * Delegates to CollectionHandlerExecutor.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    new CollectionHandlerExecutor(req, res, this._route, this._data, this._serializer, this._extractorFactory).handle();
  }
}

export default CollectionHandler;
