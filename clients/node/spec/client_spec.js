import { NaviClient } from '../client.js';
import { ConfigFileGrouper } from '../lib/ConfigFileGrouper.js';
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

  describe('#configFromJson', () => {
    it('groups the given paths in forced JSON mode and POSTs one call per namespace', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([
        { namespace: 'default', resources: {}, clients: {} },
      ]);

      const result = await client.configFromJson('a.json');

      expect(ConfigFileGrouper.group).toHaveBeenCalledWith([{ path: 'a.json', mode: 'json' }]);
      expect(NaviApiClient.prototype.post).toHaveBeenCalledWith(
        '/api/config', { namespace: 'default', resources: {}, clients: {} },
      );
      expect(result).toEqual([{ status: 'accepted' }]);
    });

    it('normalizes a single path into a one-element array', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([]);

      await client.configFromJson('a.json');

      expect(ConfigFileGrouper.group).toHaveBeenCalledWith([{ path: 'a.json', mode: 'json' }]);
    });

    it('forwards every given path, forcing json mode for each', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([]);

      await client.configFromJson(['a.json', 'b.json']);

      expect(ConfigFileGrouper.group).toHaveBeenCalledWith([
        { path: 'a.json', mode: 'json' },
        { path: 'b.json', mode: 'json' },
      ]);
    });
  });

  describe('#configFromYaml', () => {
    it('groups the given paths in forced YAML mode', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([]);

      await client.configFromYaml(['a.yml', 'b.yaml']);

      expect(ConfigFileGrouper.group).toHaveBeenCalledWith([
        { path: 'a.yml', mode: 'yaml' },
        { path: 'b.yaml', mode: 'yaml' },
      ]);
    });
  });

  describe('#configFromFiles', () => {
    it('groups the given paths in auto-detect mode', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([]);

      await client.configFromFiles(['a.yml', 'b.json']);

      expect(ConfigFileGrouper.group).toHaveBeenCalledWith([
        { path: 'a.yml', mode: 'auto' },
        { path: 'b.json', mode: 'auto' },
      ]);
    });

    it('resolves to one response per distinct namespace, in fan-out order', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([
        { namespace: 'ns1', resources: {}, clients: {} },
        { namespace: 'ns2', resources: {}, clients: {} },
      ]);
      NaviApiClient.prototype.post.and.returnValues(
        Promise.resolve({ status: 'accepted', namespace: 'ns1' }),
        Promise.resolve({ status: 'accepted', namespace: 'ns2' }),
      );

      const result = await client.configFromFiles(['a.yml', 'b.yml']);

      expect(result).toEqual([
        { status: 'accepted', namespace: 'ns1' },
        { status: 'accepted', namespace: 'ns2' },
      ]);
    });

    it('issues the POST calls sequentially, awaiting each before the next is sent', async () => {
      spyOn(ConfigFileGrouper, 'group').and.returnValue([
        { namespace: 'ns1', resources: {}, clients: {} },
        { namespace: 'ns2', resources: {}, clients: {} },
      ]);

      let resolveFirst;
      const firstCallPromise = new Promise((resolve) => { resolveFirst = resolve; });
      NaviApiClient.prototype.post.and.returnValues(firstCallPromise, Promise.resolve({ status: 'accepted' }));

      const resultPromise = client.configFromFiles(['a.yml', 'b.yml']);

      await Promise.resolve();
      await Promise.resolve();
      expect(NaviApiClient.prototype.post).toHaveBeenCalledTimes(1);

      resolveFirst({ status: 'accepted' });
      await resultPromise;

      expect(NaviApiClient.prototype.post).toHaveBeenCalledTimes(2);
    });

    it('throws before issuing any request when grouping/parsing fails', async () => {
      spyOn(ConfigFileGrouper, 'group').and.throwError('bad file');

      await expectAsync(client.configFromFiles(['bad.yml'])).toBeRejectedWithError('bad file');
      expect(NaviApiClient.prototype.post).not.toHaveBeenCalled();
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
