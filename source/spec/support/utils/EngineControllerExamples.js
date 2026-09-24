/**
 * Shared examples for the EngineController lifecycle specs.
 *
 * Each method registers `it` blocks in the `describe` that is currently being
 * defined, so it must be called from inside the caller's `describe`. The
 * controller and state are read lazily from the context object returned by
 * `EngineControllerSpecUtils.setupController`, so the values built in the
 * current `beforeEach` are the ones used.
 */
class EngineControllerExamples {
  /**
   * Registers the spec asserting the lifecycle method leaves the engine
   * untouched when the controller is running (i.e. not in the state the
   * method resumes from).
   * @param {object} ctx - Shared context holding `controller` and `state`.
   * @param {string} method - Controller method name (`continue`, `resumeProcessing`).
   * @param {string} requiredState - State the method requires, used in the description.
   */
  static doesNothingWhenRunning(ctx, method, requiredState) {
    it(`does nothing when not ${requiredState}`, async () => {
      spyOn(ctx.controller.engine, 'resume');

      await ctx.controller[method]();

      expect(ctx.controller.engine.resume).not.toHaveBeenCalled();
      expect(ctx.state.get()).toBe('running');
    });
  }

  /**
   * Registers the spec asserting the method stops then resumes the engine, in order.
   * @param {object} ctx - Shared context holding `controller` and `state`.
   * @param {string} method - Controller method name (`restart`, `reload`).
   */
  static stopsThenResumesInOrder(ctx, method) {
    it('stops then resumes the engine, in order', async () => {
      spyOn(ctx.controller, 'stop').and.callThrough();
      spyOn(ctx.controller, 'resumeProcessing').and.callThrough();

      await ctx.controller[method]();

      expect(ctx.controller.stop).toHaveBeenCalledBefore(ctx.controller.resumeProcessing);
      expect(ctx.state.get()).toBe('running');
    });
  }

  /**
   * Registers the spec asserting the method does nothing when the controller is not running.
   * @param {object} ctx - Shared context holding `controller` and `state`.
   * @param {string} method - Controller method name (`restart`, `reload`).
   */
  static doesNothingWhenNotRunning(ctx, method) {
    it('does nothing when not running', async () => {
      ctx.state.set('stopped');
      spyOn(ctx.controller, 'stop');
      spyOn(ctx.controller, 'resumeProcessing');

      await ctx.controller[method]();

      expect(ctx.controller.stop).not.toHaveBeenCalled();
      expect(ctx.controller.resumeProcessing).not.toHaveBeenCalled();
      expect(ctx.state.get()).toBe('stopped');
    });
  }
}

export { EngineControllerExamples };
