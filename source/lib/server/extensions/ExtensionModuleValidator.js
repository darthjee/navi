const SUPPORTED_METHODS = ['GET', 'PATCH', 'POST'];

/**
 * ExtensionModuleValidator turns a freshly `import()`ed extension module object
 * into either a list of accepted route descriptors or a list of human-readable
 * rejection reasons. It never throws and never touches the filesystem — the
 * loader decides what to do with the returned `errors`.
 * @author darthjee
 */
class ExtensionModuleValidator {
  /**
   * @param {object} moduleNamespace - The namespace object returned by `import()`.
   * @returns {{ descriptors: Array<object>, errors: Array<string> }} The accepted
   *   `{ method, path, handler }` descriptors and the rejection reasons.
   */
  static validate(moduleNamespace) {
    const raw = moduleNamespace?.default ?? moduleNamespace?.routes;

    if (!Array.isArray(raw)) {
      return {
        descriptors: [],
        errors: ["neither a default export nor a 'routes' export is an array"],
      };
    }

    const descriptors = [];
    const errors = [];

    raw.forEach((entry, index) => {
      const { descriptor, error } = ExtensionModuleValidator.#validateEntry(entry, index);

      if (error) errors.push(error);
      else descriptors.push(descriptor);
    });

    return { descriptors, errors };
  }

  /**
   * @param {*} entry - A single descriptor candidate.
   * @param {number} index - Its position in the module's array.
   * @returns {{ descriptor?: object, error?: string }} Either the normalised
   *   descriptor or a single rejection reason.
   */
  static #validateEntry(entry, index) {
    if (!ExtensionModuleValidator.#isPlainObject(entry)) {
      return { error: `descriptor ${index} is not an object` };
    }

    const error = ExtensionModuleValidator.#methodError(entry, index)
      ?? ExtensionModuleValidator.#pathError(entry, index)
      ?? ExtensionModuleValidator.#handlerError(entry, index);

    if (error) return { error };

    return {
      descriptor: {
        method: entry.method.toUpperCase(),
        path: entry.path,
        handler: entry.handler,
      },
    };
  }

  /**
   * @param {object} entry - The descriptor candidate.
   * @param {number} index - Its position in the module's array.
   * @returns {string|null} A rejection reason when `method` is unsupported.
   */
  static #methodError(entry, index) {
    const { method } = entry;
    const supported = typeof method === 'string' && SUPPORTED_METHODS.includes(method.toUpperCase());

    return supported ? null : `descriptor ${index} has unsupported method "${method}"`;
  }

  /**
   * @param {object} entry - The descriptor candidate.
   * @param {number} index - Its position in the module's array.
   * @returns {string|null} A rejection reason when `path` is invalid.
   */
  static #pathError(entry, index) {
    const { path } = entry;
    const valid = typeof path === 'string'
      && path.length > 0
      && path.startsWith('/')
      && !/\s/.test(path);

    return valid ? null : `descriptor ${index} has an invalid path "${path}"`;
  }

  /**
   * @param {object} entry - The descriptor candidate.
   * @param {number} index - Its position in the module's array.
   * @returns {string|null} A rejection reason when `handler` is not a class.
   */
  static #handlerError(entry, index) {
    return typeof entry.handler === 'function'
      ? null
      : `descriptor ${index} handler is not a class`;
  }

  /**
   * @param {*} value - Any value.
   * @returns {boolean} True when `value` is a non-null, non-array object.
   */
  static #isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

export { ExtensionModuleValidator };
