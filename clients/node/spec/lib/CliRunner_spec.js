import { NaviClient } from '../../client.js';
import { CliRunner } from '../../lib/CliRunner.js';
import { ConfigFileGrouper } from '../../lib/ConfigFileGrouper.js';

describe('CliRunner', () => {
  const baseUrl = 'http://example.com';
  const token = 'secret-token';

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  describe('.run', () => {
    describe('validation', () => {
      it('fails when --base-url is missing', async () => {
        const code = await CliRunner.run({ token, action: 'engine-stop' });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith('Missing required option: --base-url');
      });

      it('fails when --token is missing', async () => {
        const code = await CliRunner.run({ baseUrl, action: 'engine-stop' });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith('Missing required option: --token');
      });

      it('fails when --action is missing', async () => {
        const code = await CliRunner.run({ baseUrl, token });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith('Missing required option: --action');
      });

      it('fails when --action is invalid', async () => {
        const code = await CliRunner.run({ baseUrl, token, action: 'bogus' });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith(
          'Invalid --action "bogus". Must be one of: config, engine-start, engine-stop',
        );
      });
    });

    describe('validation of --payload / --file/--json/--yaml mutual exclusivity', () => {
      it('fails when --payload is combined with --file/--json/--yaml', async () => {
        const code = await CliRunner.run({
          baseUrl, token, action: 'config', payload: '{}', configFiles: [{ path: 'a.yml', mode: 'auto' }],
        });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith('--payload cannot be combined with --file/--json/--yaml');
      });
    });

    describe('when the payload is invalid JSON', () => {
      it('fails with a JSON error message', async () => {
        const code = await CliRunner.run({ baseUrl, token, action: 'config', payload: '{not json' });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringContaining('Invalid JSON payload'));
      });
    });

    describe('dispatching to NaviClient', () => {
      it('calls #config with the parsed payload and prints the result', async () => {
        spyOn(NaviClient.prototype, 'config').and.returnValue(Promise.resolve({ status: 'accepted' }));

        const code = await CliRunner.run({
          baseUrl, token, action: 'config', payload: '{"namespace":"reports"}',
        });

        expect(code).toBe(0);
        expect(NaviClient.prototype.config).toHaveBeenCalledWith({ namespace: 'reports' });
        expect(console.log).toHaveBeenCalledWith(JSON.stringify({ status: 'accepted' }, null, 2));
      });

      it('calls #engineStart with the parsed payload', async () => {
        spyOn(NaviClient.prototype, 'engineStart').and.returnValue(Promise.resolve({ status: 'running' }));

        const code = await CliRunner.run({ baseUrl, token, action: 'engine-start' });

        expect(code).toBe(0);
        expect(NaviClient.prototype.engineStart).toHaveBeenCalledWith(undefined);
      });

      it('calls #engineStop', async () => {
        spyOn(NaviClient.prototype, 'engineStop').and.returnValue(Promise.resolve({ status: 'stopped' }));

        const code = await CliRunner.run({ baseUrl, token, action: 'engine-stop' });

        expect(code).toBe(0);
        expect(NaviClient.prototype.engineStop).toHaveBeenCalled();
      });
    });

    describe('when config files are given', () => {
      it('groups them and calls #config once per namespace, printing the array result', async () => {
        spyOn(ConfigFileGrouper, 'group').and.returnValue([
          { namespace: 'ns1', resources: {}, clients: {} },
          { namespace: 'ns2', resources: {}, clients: {} },
        ]);
        spyOn(NaviClient.prototype, 'config').and.returnValues(
          Promise.resolve({ status: 'accepted', namespace: 'ns1' }),
          Promise.resolve({ status: 'accepted', namespace: 'ns2' }),
        );

        const configFiles = [{ path: 'a.yml', mode: 'auto' }, { path: 'b.json', mode: 'json' }];
        const code = await CliRunner.run({ baseUrl, token, action: 'config', configFiles });

        expect(code).toBe(0);
        expect(ConfigFileGrouper.group).toHaveBeenCalledWith(configFiles);
        expect(NaviClient.prototype.config).toHaveBeenCalledWith({ namespace: 'ns1', resources: {}, clients: {} });
        expect(NaviClient.prototype.config).toHaveBeenCalledWith({ namespace: 'ns2', resources: {}, clients: {} });
        expect(console.log).toHaveBeenCalledWith(JSON.stringify([
          { status: 'accepted', namespace: 'ns1' },
          { status: 'accepted', namespace: 'ns2' },
        ], null, 2));
      });

      it('fails without dispatching any request when a file fails to parse', async () => {
        spyOn(ConfigFileGrouper, 'group').and.throwError('bad file');
        spyOn(NaviClient.prototype, 'config');

        const code = await CliRunner.run({
          baseUrl, token, action: 'config', configFiles: [{ path: 'bad.yml', mode: 'auto' }],
        });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith('bad file');
        expect(NaviClient.prototype.config).not.toHaveBeenCalled();
      });
    });

    describe('when the underlying request fails', () => {
      it('prints the error message and returns 1', async () => {
        spyOn(NaviClient.prototype, 'engineStop').and.returnValue(Promise.reject(new Error('boom')));

        const code = await CliRunner.run({ baseUrl, token, action: 'engine-stop' });

        expect(code).toBe(1);
        expect(console.error).toHaveBeenCalledWith('boom');
      });
    });
  });
});
