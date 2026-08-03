import { SecuredRequestHandler } from '../../../common/server/SecuredRequestHandler.js';
import { ConflictError } from '../../../exceptions/http/ConflictError.js';
import { Application } from '../../../services/Application.js';
import { ResourceEnqueuer } from '../../../utils/ResourceEnqueuer.js';

/**
 * Executes request-handling behaviour for POST /api/engine/start.
 *
 * Mirrors `PATCH /engine/start`'s state logic (starts the engine if stopped, or
 * enqueues additional jobs if already running; `ConflictError` otherwise), but
 * resolves what to enqueue from `req.body.targets` — an array of
 * `{ namespace, resources? }` entries, each scoped to its own namespace via the
 * namespace-aware `ResourceEnqueuer` — falling back to today's top-level
 * `resources` / default-namespace behavior when `targets` is omitted entirely.
 * @author darthjee
 */
class ApiEngineStartHandler extends SecuredRequestHandler {
  /**
   * Starts engine processing from a stopped state, or pushes resources into an
   * already-running engine, scoped per namespace via `targets`.
   * @returns {Promise<void>}
   * @throws {ConflictError} When the engine is paused/pausing/stopping.
   */
  async process() {
    const targets = this.#targets();

    if (targets === false) {
      this.#badRequest('"targets" must be an array of { namespace, resources? } objects.');
      return;
    }

    if (Application.isStopped()) {
      await this.#start(targets);
      return;
    }

    if (Application.isRunning()) {
      this.#enqueue(targets);
      return;
    }

    throw new ConflictError();
  }

  /**
   * Handles the stopped → running transition, enqueueing either the top-level
   * `resources` (no `targets` given) or every named target's resources.
   * @param {Array<object>|null} targets - Parsed `targets`, or null when omitted.
   * @returns {Promise<void>}
   * @private
   */
  async #start(targets) {
    if (!targets) {
      const result = await Application.start(this.#topLevelResources());
      this.response.json({ status: 'running', ...result });
      return;
    }

    await Application.start([], { enqueue: false });
    this.response.json({ status: 'running', ...this.#aggregate(targets) });
  }

  /**
   * Handles enqueueing additional jobs into an already-running engine.
   * @param {Array<object>|null} targets - Parsed `targets`, or null when omitted.
   * @returns {void}
   * @private
   */
  #enqueue(targets) {
    if (!targets) {
      const result = Application.enqueueResources(this.#topLevelResources());
      this.response.json({ status: 'running', ...result });
      return;
    }

    this.response.json({ status: 'running', ...this.#aggregate(targets) });
  }

  /**
   * Reads the top-level `resources` array, used when `targets` is omitted.
   * @returns {Array<string>} The named resources, or an empty array.
   * @private
   */
  #topLevelResources() {
    return Array.isArray(this.request.body?.resources) ? this.request.body.resources : [];
  }

  /**
   * Parses and validates `req.body.targets`.
   * @returns {Array<object>|null|false} The parsed targets array, `null` when omitted,
   * or `false` when present but malformed.
   * @private
   */
  #targets() {
    const { targets } = this.request.body ?? {};
    if (targets === undefined) return null;
    if (!this.#validTargets(targets)) return false;
    return targets;
  }

  /**
   * Validates every entry of the `targets` array.
   * @param {*} targets - The candidate targets value.
   * @returns {boolean} True when every entry is well-formed.
   * @private
   */
  #validTargets(targets) {
    return Array.isArray(targets) && targets.every((target) => this.#validTarget(target));
  }

  /**
   * Validates a single `targets` entry.
   * @param {*} target - The candidate target entry.
   * @returns {boolean} True when the entry is well-formed.
   * @private
   */
  #validTarget(target) {
    if (!target || typeof target.namespace !== 'string' || !target.namespace.trim()) return false;
    if (target.resources === undefined) return true;

    return Array.isArray(target.resources) && target.resources.every((name) => typeof name === 'string');
  }

  /**
   * Aggregates the per-target enqueue results into one flat `{ enqueued, skippedResources }`.
   * @param {Array<{namespace: string, resources: Array<string>|undefined}>} targets - The targets to enqueue.
   * @param {{enqueued: Array<string>, skippedResources: Array<object>}} [seed] - Initial accumulator.
   * @returns {{enqueued: Array<string>, skippedResources: Array<object>}} The aggregated result.
   * @private
   */
  #aggregate(targets, seed = { enqueued: [], skippedResources: [] }) {
    return targets.reduce((acc, { namespace, resources }) => {
      const enqueuer = new ResourceEnqueuer(namespace);
      const result = resources === undefined ? enqueuer.enqueueAll() : enqueuer.enqueue(resources);

      return {
        enqueued: [...acc.enqueued, ...result.enqueued],
        skippedResources: [...acc.skippedResources, ...result.skippedResources],
      };
    }, seed);
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

export { ApiEngineStartHandler };
