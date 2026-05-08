import {
  continueEngine,
  getEngineStatus,
  pauseEngine,
  restartEngine,
  startEngine,
  stopEngine,
} from '../../src/clients/EngineClient.js';
import { mockFetchFailure, mockFetchSuccess } from '../support/fetch.js';

const engineActions = [
  {
    name: 'getEngineStatus',
    fn: getEngineStatus,
    endpoint: '/engine/status',
    successData: { status: 'running' },
    expectedResult: 'running',
    failStatus: 500,
  },
  {
    name: 'pauseEngine',
    fn: pauseEngine,
    endpoint: '/engine/pause',
    method: 'PATCH',
    successData: { status: 'pausing' },
    failStatus: 409,
  },
  {
    name: 'stopEngine',
    fn: stopEngine,
    endpoint: '/engine/stop',
    method: 'PATCH',
    successData: { status: 'stopping' },
    failStatus: 409,
  },
  {
    name: 'continueEngine',
    fn: continueEngine,
    endpoint: '/engine/continue',
    method: 'PATCH',
    successData: { status: 'running' },
    failStatus: 409,
  },
  {
    name: 'startEngine',
    fn: startEngine,
    endpoint: '/engine/start',
    method: 'PATCH',
    successData: { status: 'running' },
    failStatus: 409,
  },
  {
    name: 'restartEngine',
    fn: restartEngine,
    endpoint: '/engine/restart',
    method: 'PATCH',
    successData: { status: 'stopping' },
    failStatus: 409,
  },
];

describe('EngineClient', () => {
  engineActions.forEach(({ name, fn, endpoint, method, successData, expectedResult, failStatus }) => {
    describe(name, () => {
      describe('when the request succeeds', () => {
        mockFetchSuccess(successData);

        it('calls the correct endpoint', async () => {
          await fn();
          const expectedArgs = method ? [endpoint, { method }] : [endpoint];
          expect(globalThis.fetch).toHaveBeenCalledWith(...expectedArgs);
        });

        it('returns the expected result', async () => {
          const result = await fn();
          expect(result).toEqual(expectedResult ?? successData);
        });
      });

      describe('when the request fails', () => {
        mockFetchFailure(failStatus);

        it('throws an error with the status code', async () => {
          await expectAsync(fn()).toBeRejectedWithError(`HTTP ${failStatus}`);
        });
      });
    });
  });
});
