import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigFileParser } from '../../lib/ConfigFileParser.js';
import { ConfigFileParseError } from '../../lib/exceptions/ConfigFileParseError.js';

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
});
