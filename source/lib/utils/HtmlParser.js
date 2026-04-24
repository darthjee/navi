import { parse } from 'node-html-parser';
import { HtmlElementParser } from './HtmlElementParser.js';
import { InvalidHtmlResponseBody } from '../exceptions/InvalidHtmlResponseBody.js';
import { Logger } from './logging/Logger.js';

/**
 * HtmlParser parses a raw HTML string and extracts attribute values using CSS selectors.
 * @author darthjee
 */
class HtmlParser {
  /**
   * Parses the given HTML string, finds all elements matching the selector,
   * and returns an array of the specified attribute value from each matched element.
   *
   * Logs a warning when the selector matches zero elements.
   * Logs a warning and skips elements missing the target attribute.
   * @param {string} rawHtml The raw HTML string to parse.
   * @param {string} selector CSS selector to match elements.
   * @param {string} attribute Attribute name whose value is extracted from each matched element.
   * @returns {Array<string>} Array of attribute values from matched elements.
   * @throws {InvalidHtmlResponseBody} If the HTML cannot be parsed.
   */
  static parse(rawHtml, selector, attribute) {
    let root;

    try {
      root = parse(rawHtml);
    } catch (cause) {
      throw new InvalidHtmlResponseBody(rawHtml, cause);
    }

    const elements = root.querySelectorAll(selector);

    if (elements.length === 0) {
      Logger.warn(`HtmlParser: selector "${selector}" matched zero elements`);
      return [];
    }

    const values = [];
    for (const element of elements) {
      const value = new HtmlElementParser(element, selector).getAttribute(attribute);
      if (value !== null) values.push(value);
    }

    return values;
  }
}

export { HtmlParser };
