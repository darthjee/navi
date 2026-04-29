import {
  getEngineStatus,
  pauseEngine,
  stopEngine,
  continueEngine,
  startEngine,
  restartEngine,
} from '../../src/clients/EngineClient.js';

describe('EngineClient', () => {
  describe('getEngineStatus', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'running' }) })
        );
      });

      it('fetches from /engine/status', async () => {
        await getEngineStatus();
        expect(globalThis.fetch).toHaveBeenCalledWith('/engine/status');
      });

      it('returns the status string', async () => {
        const result = await getEngineStatus();
        expect(result).toBe('running');
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 500 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(getEngineStatus()).toBeRejectedWithError('HTTP 500');
      });
    });
  });

  describe('pauseEngine', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'pausing' }) })
        );
      });

      it('sends a PATCH request to /engine/pause', async () => {
        await pauseEngine();
        expect(globalThis.fetch).toHaveBeenCalledWith('/engine/pause', { method: 'PATCH' });
      });

      it('returns the response data', async () => {
        const result = await pauseEngine();
        expect(result).toEqual({ status: 'pausing' });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 409 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(pauseEngine()).toBeRejectedWithError('HTTP 409');
      });
    });
  });

  describe('stopEngine', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'stopping' }) })
        );
      });

      it('sends a PATCH request to /engine/stop', async () => {
        await stopEngine();
        expect(globalThis.fetch).toHaveBeenCalledWith('/engine/stop', { method: 'PATCH' });
      });

      it('returns the response data', async () => {
        const result = await stopEngine();
        expect(result).toEqual({ status: 'stopping' });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 409 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(stopEngine()).toBeRejectedWithError('HTTP 409');
      });
    });
  });

  describe('continueEngine', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'running' }) })
        );
      });

      it('sends a PATCH request to /engine/continue', async () => {
        await continueEngine();
        expect(globalThis.fetch).toHaveBeenCalledWith('/engine/continue', { method: 'PATCH' });
      });

      it('returns the response data', async () => {
        const result = await continueEngine();
        expect(result).toEqual({ status: 'running' });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 409 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(continueEngine()).toBeRejectedWithError('HTTP 409');
      });
    });
  });

  describe('startEngine', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'running' }) })
        );
      });

      it('sends a PATCH request to /engine/start', async () => {
        await startEngine();
        expect(globalThis.fetch).toHaveBeenCalledWith('/engine/start', { method: 'PATCH' });
      });

      it('returns the response data', async () => {
        const result = await startEngine();
        expect(result).toEqual({ status: 'running' });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 409 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(startEngine()).toBeRejectedWithError('HTTP 409');
      });
    });
  });

  describe('restartEngine', () => {
    describe('when the request succeeds', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'stopping' }) })
        );
      });

      it('sends a PATCH request to /engine/restart', async () => {
        await restartEngine();
        expect(globalThis.fetch).toHaveBeenCalledWith('/engine/restart', { method: 'PATCH' });
      });

      it('returns the response data', async () => {
        const result = await restartEngine();
        expect(result).toEqual({ status: 'stopping' });
      });
    });

    describe('when the request fails', () => {
      beforeEach(() => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: false, status: 409 })
        );
      });

      it('throws an error with the status code', async () => {
        await expectAsync(restartEngine()).toBeRejectedWithError('HTTP 409');
      });
    });
  });
});
