import { SecuredRequestHandler } from '../../../common/server/SecuredRequestHandler.js';
import { AppError } from '../../../exceptions/AppError.js';
import { NamespaceMap } from '../../../registry/NamespaceMap.js';
import { Application } from '../../../services/Application.js';
import { ResourceEnqueuer } from '../../../utils/ResourceEnqueuer.js';

/**
 * Executes request-handling behaviour for POST /api/config.
 *
 * Merges a single namespace's `resources`/`clients` into the running `NamespaceMap`
 * (creating the namespace when it doesn't yet exist, replacing on name clash), reusing
 * the same merge/validation machinery boot-time config loading already relies on.
 * Only when the engine is currently running, the param-free resources among those
 * just added/updated are additionally enqueued.
 * @author darthjee
 */
class ApiConfigHandler extends SecuredRequestHandler {
  /**
   * Validates the payload, merges it into the target namespace, optionally enqueues
   * the newly added/updated param-free resources, then responds.
   * @returns {void}
   */
  process() {
    const body = this.request.body ?? {};
    const { namespace } = body;

    if (!this.#validNamespace(namespace)) {
      this.#badRequest('"namespace" is required and must be a non-empty string.');
      return;
    }

    const resources = body.resources ?? {};
    const clients = body.clients ?? {};

    if (!this.#isPlainObject(resources) || !this.#isPlainObject(clients)) {
      this.#badRequest('"resources" and "clients" must be objects when present.');
      return;
    }

    if (!this.#merge(namespace, resources, clients)) return;

    if (Application.isRunning()) {
      new ResourceEnqueuer(namespace).enqueue(Object.keys(resources));
    }

    this.response.json({ status: 'accepted' });
  }

  /**
   * Merges the payload into the target namespace, responding with 400 when the
   * merge raises a known config/registry validation error.
   * @param {string} namespace - The target namespace name.
   * @param {object} resources - The namespace's incoming resources.
   * @param {object} clients - The namespace's incoming clients.
   * @returns {boolean} True when the merge succeeded.
   * @private
   */
  #merge(namespace, resources, clients) {
    try {
      NamespaceMap.include([{ namespace, resources, clients }]);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        this.#badRequest(error.message);
        return false;
      }
      throw error;
    }
  }

  /**
   * Validates that the given namespace is a non-empty string.
   * @param {*} namespace - The candidate namespace value.
   * @returns {boolean} True when valid.
   * @private
   */
  #validNamespace(namespace) {
    return typeof namespace === 'string' && namespace.trim().length > 0;
  }

  /**
   * Validates that the given value is a plain (non-array, non-null) object.
   * @param {*} value - The candidate value.
   * @returns {boolean} True when it is a plain object.
   * @private
   */
  #isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Responds with a 400 error body.
   * @param {string} message - The error message.
   * @returns {void}
   * @private
   */
  #badRequest(message) {
    this.response.status(400).json({ error: message });
  }
}

export { ApiConfigHandler };
