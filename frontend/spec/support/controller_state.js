// Builds the spies and refs recurring across the controller specs.
const buildControllerState = () => ({
  setData: jasmine.createSpy('setData'),
  setError: jasmine.createSpy('setError'),
  setLoading: jasmine.createSpy('setLoading'),
  cancelledRef: { current: false },
  lastIdRef: { current: null },
});

// Registers a beforeEach that refreshes the returned holder with a new
// controller state, so specs can read `state.setData`, `state.cancelledRef`, etc.
const useControllerState = () => {
  const state = {};

  beforeEach(() => {
    Object.assign(state, buildControllerState());
  });

  return state;
};

export { buildControllerState, useControllerState };
