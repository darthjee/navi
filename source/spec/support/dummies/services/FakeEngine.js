/**
 * Minimal fake Engine test double that supports the `on`/`emit` listener API,
 * so specs can assert on listener wiring without depending on the real Engine
 * implementation.
 */
class FakeEngine {
  /**
   * Builds a fake engine with no-op lifecycle methods and a working
   * `on`/`emit` pair backed by a handlers map.
   * @param {object} [overrides={}] - Properties to override on the fake engine.
   * @returns {object} The fake engine instance.
   */
  static build(overrides = {}) {
    const handlers = {};

    return {
      start: async () => {},
      pause: () => {},
      resume: () => {},
      stop: () => {},
      on: (eventName, handler) => {
        handlers[eventName] = handler;
      },
      emit: (eventName, ...args) => {
        handlers[eventName]?.(...args);
      },
      ...overrides,
    };
  }
}

export { FakeEngine };
