import { TokenResolver } from './TokenResolver.js';

/**
 * TemplateStringRenderer renders a single template string against an item, resolving
 * `{:key}` / `{:nested.path}` tokens, used by `ResourceRequestEmit`'s body template
 * rendering pipeline.
 * @author darthjee
 */
class TemplateStringRenderer {
  /**
   * Renders a single template string against the given item, resolving `{:key}` /
   * `{:nested.path}` tokens.
   * @param {string} str The template string to render.
   * @param {*} item The item to resolve tokens against.
   * @returns {*} The rendered value: the resolved value verbatim for whole-token strings,
   * or a string with every resolvable token interpolated.
   */
  static render(str, item) {
    const wholeTokenMatch = str.match(/^\{:([.\w]+)\}$/);

    if (wholeTokenMatch) {
      const value = TokenResolver.resolve(wholeTokenMatch[1], item);

      return value === undefined ? str : value;
    }

    return str.replace(/\{:([.\w]+)\}/g, (full, path) => {
      const value = TokenResolver.resolve(path, item);

      return value === undefined ? full : String(value);
    });
  }
}

export { TemplateStringRenderer };
