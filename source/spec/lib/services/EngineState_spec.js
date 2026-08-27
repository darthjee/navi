import { EngineState } from '../../../lib/services/EngineState.js';

describe('EngineState', () => {
  let state;

  beforeEach(() => {
    state = new EngineState();
  });

  describe('#get', () => {
    it('returns undefined before anything has run', () => {
      expect(state.get()).toBeUndefined();
    });

    it('returns the current status after being set', () => {
      state.set('running');

      expect(state.get()).toBe('running');
    });
  });

  describe('#set', () => {
    it('sets the status as-is', () => {
      state.set('stopping');

      expect(state.get()).toBe('stopping');
    });
  });

  describe('#isRunning', () => {
    it('returns false while undefined', () => {
      expect(state.isRunning()).toBe(false);
    });

    it('returns true when status is running', () => {
      state.set('running');

      expect(state.isRunning()).toBe(true);
    });

    it('returns false when status is not running', () => {
      state.set('paused');

      expect(state.isRunning()).toBe(false);
    });
  });

  describe('#isPaused', () => {
    it('returns false while undefined', () => {
      expect(state.isPaused()).toBe(false);
    });

    it('returns true when status is paused', () => {
      state.set('paused');

      expect(state.isPaused()).toBe(true);
    });

    it('returns false when status is not paused', () => {
      state.set('running');

      expect(state.isPaused()).toBe(false);
    });
  });

  describe('#isStopped', () => {
    it('returns false while undefined', () => {
      expect(state.isStopped()).toBe(false);
    });

    it('returns true when status is stopped', () => {
      state.set('stopped');

      expect(state.isStopped()).toBe(true);
    });

    it('returns false when status is not stopped', () => {
      state.set('stopping');

      expect(state.isStopped()).toBe(false);
    });
  });
});
