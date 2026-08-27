import { FieldsMapper } from './css_selector_parser/FieldsMapper.js';
import { FilterMatcher } from './css_selector_parser/FilterMatcher.js';
import { ValueResolver } from './css_selector_parser/ValueResolver.js';
import { HtmlRootParser } from '../common/utils/parser/HtmlRootParser.js';
import { MissingParserField } from '../exceptions/config/MissingParserField.js';
import { MissingParserMatch } from '../exceptions/config/MissingParserMatch.js';

/**
 * CssSelectorParser extracts a list of mapped items from a raw HTML response body,
 * selecting repeated container elements via a CSS selector declared as `match`, optionally
 * filtering containers, and mapping each container's fields (or a single field, in fallback
 * mode) into an {@link ExtractedItem}, following the `Parser` interface shared with
 * {@link RegexParser} and {@link JsonPathParser}.
 * @author darthjee
 */
class CssSelectorParser {
  /**
   * Extracts data from the given raw HTML body using the CSS selector declared in
   * `attributes.match`, optionally filtering matched containers via `attributes.filter`,
   * and mapping each container into an output item via `attributes.fields` (multi-field
   * mode) or `attributes.field`/`attributes.attribute` (fallback single-field mode).
   * @param {string} rawBody The raw HTML response body to extract data from.
   * @param {object} attributes The parser attributes.
   * @param {string} attributes.match A CSS selector for the repeated container elements.
   * @param {Array<object>} [attributes.filter] Optional list of AND'ed conditions a container
   * must satisfy to be included. Each condition is `{ selector, attribute, trim, equals }`,
   * resolved relative to the container and compared for strict equality against `equals`.
   * @param {object} [attributes.fields] A `{ outputKey: { selector, attribute, array, trim } }`
   * map. When present, enables multi-field mode: each field's `selector` runs relative to the
   * matched container (absent/empty `selector` means the container itself).
   * @param {string} [attributes.field] Fallback mode's single output key name. Required when
   * `attributes.fields` is absent.
   * @param {string} [attributes.attribute] Fallback mode's attribute name to read off the
   * matched container (text content when absent).
   * @param {boolean} [attributes.trim] Fallback mode's trim option (default `true`).
   * @returns {Array<ExtractedItem>} An array of output items, one per matched container that
   * passes `filter` (or all matched containers when `filter` is absent). An empty array when
   * `match` matches zero containers.
   * @throws {MissingParserMatch} If `attributes.match` is absent.
   * @throws {MissingParserField} If `attributes.fields` is absent and `attributes.field` is
   * also absent.
   * @throws {InvalidHtmlResponseBody} If `rawBody` cannot be parsed as HTML.
   */
  extract(rawBody, { match, filter, fields, field, attribute, trim } = {}) {
    if (!match) throw new MissingParserMatch();
    if (!fields && !field) throw new MissingParserField();

    const root = new HtmlRootParser().parse(rawBody);
    const containers = root.querySelectorAll(match);

    return containers
      .filter((container) => new FilterMatcher(filter).matches(container))
      .map((container) => (
        fields
          ? new FieldsMapper(fields).map(container)
          : { [field]: new ValueResolver({ attribute, trim }).resolve(container) }
      ));
  }
}

export { CssSelectorParser };
