/**
 * HTML fixture builders used by CssSelectorParser specs.
 *
 * Every method returns a plain HTML string; they are meant to be composed, e.g.
 * `CssSelectorHtmlFixtures.product(CssSelectorHtmlFixtures.tag('new'))`.
 */
class CssSelectorHtmlFixtures {
  /**
   * Builds a `.product` container wrapping the given children.
   * @param {...string} children - HTML strings placed inside the container.
   * @returns {string} The container markup.
   */
  static product(...children) {
    return `<div class="product">${children.join('')}</div>`;
  }

  /**
   * Builds a `.tag` element.
   * @param {string} text - Text content of the element.
   * @returns {string} The element markup.
   */
  static tag(text) {
    return `<span class="tag">${text}</span>`;
  }

  /**
   * Builds a `.stock` element carrying a `data-available` attribute.
   * @param {string} available - Value of `data-available`.
   * @returns {string} The element markup.
   */
  static stock(available) {
    return `<span class="stock" data-available="${available}"></span>`;
  }

  /**
   * Builds a `.category` element.
   * @param {string} name - Text content of the element.
   * @returns {string} The element markup.
   */
  static category(name) {
    return `<span class="category">${name}</span>`;
  }

  /**
   * Builds an `h2` title element.
   * @param {string} text - Text content of the element.
   * @returns {string} The element markup.
   */
  static title(text) {
    return `<h2>${text}</h2>`;
  }

  /**
   * Builds the `a.primary` and `a.canonical` links.
   * @param {string} primaryHref - `href` of the primary link.
   * @param {string} canonicalHref - `href` of the canonical link.
   * @returns {string} The markup of both links.
   */
  static linkPair(primaryHref, canonicalHref) {
    return `<a class="primary" href="${primaryHref}"></a><a class="canonical" href="${canonicalHref}"></a>`;
  }

  /**
   * Builds a `.product` holding a primary/canonical link pair and a title.
   * @param {string} title - Title of the product.
   * @param {string} primaryHref - `href` of the primary link.
   * @param {string} canonicalHref - `href` of the canonical link.
   * @returns {string} The container markup.
   */
  static linkedProduct(title, primaryHref, canonicalHref) {
    return CssSelectorHtmlFixtures.product(
      CssSelectorHtmlFixtures.linkPair(primaryHref, canonicalHref),
      CssSelectorHtmlFixtures.title(title),
    );
  }

  /**
   * Builds two linked products: Widget, whose links agree, and Gadget, whose primary link differs.
   * @returns {string} The markup of both containers.
   */
  static widgetAndGadget() {
    return CssSelectorHtmlFixtures.linkedProduct('Widget', '/product/widget', '/product/widget')
      + CssSelectorHtmlFixtures.linkedProduct('Gadget', '/product/gadget?ref=ad', '/product/gadget');
  }
}

export { CssSelectorHtmlFixtures };
