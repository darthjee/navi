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
   *
   * `MenuConfig` owns the reposition / label logic and may pass an already
   * resolved `text` (e.g. a shipped default label) that wins over `entry.text`.
   * `hidden` is intentionally not carried onto the instance — its meaning is
   * applied in `MenuConfig`.
   * @param {object} entry - A mapping with `route`, optional `text`, optional `hidden`.
   * @param {string} [resolvedText] - A resolved display text that wins over `entry.text`.
   * @returns {MenuEntry} The parsed MenuEntry instance.
   */
  static fromObject(entry, resolvedText) {
    return new MenuEntry({ route: entry.route, text: resolvedText ?? entry.text });
  }

  /**
   * Validates a raw menu entry mapping.
   * @param {*} entry - The raw entry to validate.
   * @returns {{ valid: boolean, reason: (string|undefined) }} Validation outcome.
   */
  static validate(entry) {
    const reason = this.#firstReason(entry);

    return reason ? { valid: false, reason } : { valid: true, reason: undefined };
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
   * Returns the first validation failure reason for a raw entry, or undefined
   * when the entry is valid.
   * @param {*} entry - The raw entry to validate.
   * @returns {(string|undefined)} The first failure reason, or undefined.
   */
  static #firstReason(entry) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return 'entry must be a mapping';
    }

    const unknownKey = Object.keys(entry).find((key) => !ALLOWED_KEYS.includes(key));
    if (unknownKey) return `unknown key "${unknownKey}"`;

    return this.#validateRoute(entry.route)
      ?? this.#validateText(entry)
      ?? this.#validateHidden(entry);
  }

  /**
   * Validates the optional `text` field of a raw entry.
   * @param {object} entry - The raw entry.
   * @returns {(string|undefined)} A reason string when invalid, otherwise undefined.
   */
  static #validateText(entry) {
    if (!('text' in entry)) return undefined;
    if (typeof entry.text !== 'string' || entry.text.length === 0) {
      return 'text must be a non-empty string';
    }
    return undefined;
  }

  /**
   * Validates the optional `hidden` field of a raw entry.
   * @param {object} entry - The raw entry.
   * @returns {(string|undefined)} A reason string when invalid, otherwise undefined.
   */
  static #validateHidden(entry) {
    if (!('hidden' in entry)) return undefined;
    if (typeof entry.hidden !== 'boolean') return 'hidden must be a boolean';
    return undefined;
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
