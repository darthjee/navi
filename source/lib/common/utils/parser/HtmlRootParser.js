import { parse } from 'node-html-parser';
import { InvalidHtmlResponseBody } from '../../../exceptions/request/InvalidHtmlResponseBody.js';

/**
 * HtmlRootParser parses a raw HTML string into a DOM root while normalizing
 * parser failures to {@link InvalidHtmlResponseBody}.
 * @author darthjee
 */
class HtmlRootParser {
  /**
   * Parses a raw HTML string into a DOM root.
   * @param {string} rawBody The raw HTML response body to parse.
   * @returns {HTMLElement} The parsed DOM root.
   * @throws {InvalidHtmlResponseBody} If the body cannot be parsed as HTML.
   */
  parse(rawBody) {
    try {
      return parse(rawBody);
    } catch (cause) {
      throw new InvalidHtmlResponseBody(rawBody, cause);
    }
  }
}

export { HtmlRootParser };
