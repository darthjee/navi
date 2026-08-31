import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigFileParser } from '../../lib/ConfigFileParser.js';
import { ConfigFileParseError } from '../../lib/exceptions/ConfigFileParseError.js';
import { Logger } from '../../lib/logging/Logger.js';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'support', 'fixtures');
const fixture = (name) => { return path.join(FIXTURES_DIR, name); };

describe('ConfigFileParser', () => {
  describe('.parse', () => {
    it('parses a YAML file by extension (auto mode)', () => {
      const result = ConfigFileParser.parse(fixture('explicit_namespace.yaml'));

      expect(result).toEqual({
        namespace: 'reports',
        resources: { sales: { client: 'api', path: '/sales' } },
        clients: { api: { base_url: 'https://example.com' } },
      });
    });

    it('parses a JSON file by extension (auto mode)', () => {
      const result = ConfigFileParser.parse(fixture('config.json'));

      expect(result).toEqual({
        namespace: 'billing',
        resources: { invoices: { client: 'api', path: '/invoices' } },
        clients: {},
      });
    });

    it('defaults namespace to "default" and resources/clients to {} when absent', () => {
      const result = ConfigFileParser.parse(fixture('default_namespace.yml'));

      expect(result).toEqual({
        namespace: 'default',
        resources: { users: { client: 'api', path: '/users' } },
        clients: {},
      });
    });

    it('defaults everything when the file parses to a nullish value (e.g. empty content)', () => {
      const result = ConfigFileParser.parse(fixture('empty.yml'));

      expect(result).toEqual({ namespace: 'default', resources: {}, clients: {} });
    });

    it('silently ignores an `include:` key and every other top-level key', () => {
      const result = ConfigFileParser.parse(fixture('with_include.yml'));

      expect(result).toEqual({
        namespace: 'reports',
        resources: { extra: { client: 'api', path: '/extra' } },
        clients: {},
      });
    });

    it('resolves ${VAR}-style env var references before parsing', () => {
      process.env.FIXTURE_ENV_VAR = 'https://resolved.example.com';

      const result = ConfigFileParser.parse(fixture('env_var.yml'));

      expect(result.resources.users.base_url).toBe('https://resolved.example.com');

      delete process.env.FIXTURE_ENV_VAR;
    });

    it('forces JSON parsing regardless of extension when mode is "json"', () => {
      const result = ConfigFileParser.parse(fixture('config.json'), 'json');

      expect(result.namespace).toBe('billing');
    });

    it('forces YAML parsing regardless of extension when mode is "yaml"', () => {
      const result = ConfigFileParser.parse(fixture('explicit_namespace.yaml'), 'yaml');

      expect(result.namespace).toBe('reports');
    });

    it('throws a ConfigFileParseError when the file is missing', () => {
      expect(() => { ConfigFileParser.parse(fixture('does-not-exist.yml')); })
        .toThrowMatching((error) => {
          return error instanceof ConfigFileParseError &&
            error.path === fixture('does-not-exist.yml') &&
            error.message.includes('Failed to read config file');
        });
    });

    it('throws a ConfigFileParseError when the JSON content fails to parse', () => {
      expect(() => { ConfigFileParser.parse(fixture('malformed.json')); })
        .toThrowMatching((error) => {
          return error instanceof ConfigFileParseError &&
            error.message.includes('Failed to parse config file') &&
            error.message.includes('json');
        });
    });

    it('throws a ConfigFileParseError when the YAML content fails to parse', () => {
      expect(() => { ConfigFileParser.parse(fixture('malformed.yml')); })
        .toThrowMatching((error) => {
          return error instanceof ConfigFileParseError &&
            error.message.includes('Failed to parse config file') &&
            error.message.includes('yaml');
        });
    });
  });

  describe('debug logging of $VAR interpolation', () => {
    beforeEach(() => {
      spyOn(Logger, 'debug');
    });

    afterEach(() => {
      delete process.env.FIXTURE_ENV_VAR;
      delete process.env.FIXTURE_MISSING_VAR;
    });

    it('emits one debug line per distinct variable, deduped across repeated occurrences', () => {
      process.env.FIXTURE_ENV_VAR = 'resolved-value';

      ConfigFileParser.parse(fixture('repeated_env_var.yml'));

      const variableCalls = Logger.debug.calls.allArgs()
        .filter(([message]) => { return message.includes('FIXTURE_ENV_VAR'); });

      expect(variableCalls.length).toBe(1);
      expect(variableCalls[0]).toEqual([
        'Config interpolation: $FIXTURE_ENV_VAR',
        jasmine.objectContaining({
          path: fixture('repeated_env_var.yml'),
          defined: true,
          length: 'resolved-value'.length,
          hash: jasmine.any(String),
        }),
      ]);
    });

    it('emits a per-file summary line with per-occurrence placeholder/resolved/missing counts', () => {
      process.env.FIXTURE_ENV_VAR = 'resolved-value';

      ConfigFileParser.parse(fixture('mixed_env_vars.yml'));

      expect(Logger.debug).toHaveBeenCalledWith(
        `Config interpolation summary: ${fixture('mixed_env_vars.yml')}`,
        {
          path: fixture('mixed_env_vars.yml'),
          placeholders: 2,
          resolved: 1,
          missing: 1,
        },
      );
    });

    it('reports an unset variable as not defined, without length or hash', () => {
      ConfigFileParser.parse(fixture('env_var.yml'));

      expect(Logger.debug).toHaveBeenCalledWith(
        'Config interpolation: $FIXTURE_ENV_VAR',
        { path: fixture('env_var.yml'), defined: false },
      );
    });

    it('logs an independent summary and variable set per file for multi-file runs', () => {
      process.env.FIXTURE_ENV_VAR = 'resolved-value';

      ConfigFileParser.parse(fixture('repeated_env_var.yml'));
      ConfigFileParser.parse(fixture('mixed_env_vars.yml'));

      expect(Logger.debug).toHaveBeenCalledWith(
        `Config interpolation summary: ${fixture('repeated_env_var.yml')}`,
        jasmine.objectContaining({ path: fixture('repeated_env_var.yml'), placeholders: 2 }),
      );
      expect(Logger.debug).toHaveBeenCalledWith(
        `Config interpolation summary: ${fixture('mixed_env_vars.yml')}`,
        jasmine.objectContaining({ path: fixture('mixed_env_vars.yml'), placeholders: 2 }),
      );
    });
  });
});
