import { TemplateStringRenderer } from './TemplateStringRenderer.js';

/**
 * BodyTemplateRenderer recursively renders a body template node against an item, used by
 * `ResourceRequestEmit#resolveBody` to wrap/re-shape an extracted item before it is sent
 * as the emit request body.
 * @author darthjee
 */
class BodyTemplateRenderer {
  /**
   * Recursively renders a body template node against the given item.
   * @param {*} node The template node to render (array, plain object, string, or scalar).
   * @param {*} item The item to resolve tokens against.
   * @returns {*} The rendered node.
   */
  static render(node, item) {
    if (Array.isArray(node)) {
      return node.map((element) => BodyTemplateRenderer.render(element, item));
    }

    if (node !== null && typeof node === 'object') {
      return Object.fromEntries(
        Object.entries(node).map(([key, value]) => [key, BodyTemplateRenderer.render(value, item)])
      );
    }

    if (typeof node === 'string') {
      return TemplateStringRenderer.render(node, item);
    }

    return node;
  }
}

export { BodyTemplateRenderer };
