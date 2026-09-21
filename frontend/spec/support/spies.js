// Builds the state setter spies used by the page controllers' effects.
const buildSetterSpies = () => ({
  setJobs: jasmine.createSpy('setJobs'),
  setError: jasmine.createSpy('setError'),
  setLoading: jasmine.createSpy('setLoading'),
});

export { buildSetterSpies };
