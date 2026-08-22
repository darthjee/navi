import { NamedRegistry } from './NamedRegistry.js';
import { ParserNotFound } from '../exceptions/registry/ParserNotFound.js';

/**
 * ParserRegistry manages parser implementation retrieval logic, mapping a
 * `parser.type` string (e.g. `"regex"`) to a parser implementation instance.
 *
 * A plain `NamedRegistry` subclass, extendable with new parser types (e.g. `json_path`)
 * without changing `ExtractionJob` itself.
 *
 * @example
 * const parserRegistry = new ParserRegistry({
 *   regex: new RegexParser(),
 * });
 *
 * parserRegistry.getItem('regex'); // returns the RegexParser instance
 * parserRegistry.getItem('json_path'); // throws ParserNotFound error
 *
 * @author darthjee
 */
class ParserRegistry extends NamedRegistry {
  /**
   * The exception class to throw when a parser is not found.
   * @see ParserNotFound
   * @type {class}
   * @see NamedRegistry#notFound
   * @see NamedRegistry#notFoundException
   */
  static notFoundException = ParserNotFound;
}

export { ParserRegistry };
