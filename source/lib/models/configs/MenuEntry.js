const ALLOWED_KEYS = ['route', 'text', 'hidden'];
const URL_PATTERN = /^https?:\/\//;
const WHITESPACE_PATTERN = /\s/;

/**
 * Represents a single internal navigation menu entry configured for the UI.
 * @author darthjee
 */
class MenuEntry {
  /**
   * Creates a MenuEntry instance.
   * @param {object} params - Constructor params.
   * @param {string} params.route - The entry route (internal SPA path or external URL).
   * @param {string} [params.text] - Display text; defaults to the route.
   */
  constructor({ route, text }) {
    this.route = route;
    this.text = text ?? route;
  }

  /**
   * Creates a MenuEntry instance from a YAML mapping entry.
   * @param {object} entry - A mapping with `route`, optional `text`, optional `hidden`.
   * @returns {MenuEntry} The parsed MenuEntry instance.
   */
  static fromObject(entry) {
    return new MenuEntry({ route: entry.route, text: entry.text });
  }

  /**
   * Validates a raw menu entry mapping.
   * @param {*} entry - The raw entry to validate.
   * @returns {{ valid: boolean, reason: (string|undefined) }} Validation outcome.
   */
  static validate(entry) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return { valid: false, reason: 'entry must be a mapping' };
    }

    const unknownKey = Object.keys(entry).find((key) => !ALLOWED_KEYS.includes(key));
    if (unknownKey) return { valid: false, reason: `unknown key "${unknownKey}"` };

    const routeReason = this.#validateRoute(entry.route);
    if (routeReason) return { valid: false, reason: routeReason };

    if ('text' in entry && (typeof entry.text !== 'string' || entry.text.length === 0)) {
      return { valid: false, reason: 'text must be a non-empty string' };
    }

    if ('hidden' in entry && typeof entry.hidden !== 'boolean') {
      return { valid: false, reason: 'hidden must be a boolean' };
    }

    return { valid: true, reason: undefined };
  }

  /**
   * Convenience boolean wrapper around {@link MenuEntry.validate}.
   * @param {*} entry - The raw entry to validate.
   * @returns {boolean} Whether the entry is valid.
   */
  static isValid(entry) {
    return this.validate(entry).valid;
  }

  /**
   * Serializes this entry for JSON responses. `hidden` is never serialized.
   * @returns {{ route: string, text: string }} The serialized entry.
   */
  toJSON() {
    return { route: this.route, text: this.text };
  }

  /**
   * Validates the `route` field of a raw entry.
   * @param {*} route - The route value.
   * @returns {(string|undefined)} A reason string when invalid, otherwise undefined.
   */
  static #validateRoute(route) {
    if (typeof route !== 'string' || route.length === 0) {
      return 'route is required and must be a non-empty string';
    }
    if (WHITESPACE_PATTERN.test(route)) return 'route must not contain whitespace';
    if (!route.startsWith('/') && !URL_PATTERN.test(route)) {
      return 'route must start with "/" or match ^https?://';
    }
    return undefined;
  }
}

export { MenuEntry };
