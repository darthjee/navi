import { NaviClient } from '../client.js';
import { NaviApiClient } from '../lib/NaviApiClient.js';

describe('NaviClient', () => {
  const baseUrl = 'http://example.com';
  const token = 'secret-token';

  let client;

  beforeEach(() => {
    client = new NaviClient({ baseUrl, token });
    spyOn(NaviApiClient.prototype, 'post').and.returnValue(Promise.resolve({ status: 'accepted' }));
  });

  describe('#config', () => {
    it('POSTs to /api/config with the given payload and returns the response', async () => {
      const payload = { namespace: 'reports', resources: {} };

      const result = await client.config(payload);

      expect(NaviApiClient.prototype.post).toHaveBeenCalledWith('/api/config', payload);
      expect(result).toEqual({ status: 'accepted' });
    });
  });

  describe('#engineStart', () => {
    it('POSTs to /api/engine/start with the given payload', async () => {
      const payload = { targets: [{ namespace: 'reports' }] };

      await client.engineStart(payload);

      expect(NaviApiClient.prototype.post).toHaveBeenCalledWith('/api/engine/start', payload);
    });

    it('defaults the payload to {} when none is given', async () => {
      await client.engineStart();

      expect(NaviApiClient.prototype.post).toHaveBeenCalledWith('/api/engine/start', {});
    });
  });

  describe('#engineStop', () => {
    it('POSTs to /api/engine/stop with no body', async () => {
      await client.engineStop();

      expect(NaviApiClient.prototype.post).toHaveBeenCalledWith('/api/engine/stop');
    });
  });
});
