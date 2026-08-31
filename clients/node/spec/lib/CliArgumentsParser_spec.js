import { CliArgumentsParser } from '../../lib/CliArgumentsParser.js';

describe('CliArgumentsParser', () => {
  describe('.parse', () => {
    it('parses long-form options', () => {
      const result = CliArgumentsParser.parse([
        '--base-url', 'http://example.com',
        '--token', 'secret',
        '--action', 'config',
        '--payload', '{"namespace":"reports"}',
      ]);

      expect(result).toEqual({
        baseUrl: 'http://example.com',
        token: 'secret',
        action: 'config',
        payload: '{"namespace":"reports"}',
        configFiles: [],
        logLevel: undefined,
      });
    });

    it('parses short-form options', () => {
      const result = CliArgumentsParser.parse([
        '-b', 'http://example.com',
        '-t', 'secret',
        '-a', 'engine-stop',
      ]);

      expect(result).toEqual({
        baseUrl: 'http://example.com',
        token: 'secret',
        action: 'engine-stop',
        payload: undefined,
        configFiles: [],
        logLevel: undefined,
      });
    });

    it('leaves options undefined when not given', () => {
      const result = CliArgumentsParser.parse([]);

      expect(result).toEqual({
        baseUrl: undefined,
        token: undefined,
        action: undefined,
        payload: undefined,
        configFiles: [],
        logLevel: undefined,
      });
    });

    it('parses --log-level', () => {
      const result = CliArgumentsParser.parse(['--log-level', 'debug']);

      expect(result.logLevel).toBe('debug');
    });

    it('collects repeated --file options', () => {
      const result = CliArgumentsParser.parse(['--file', 'a.yml', '--file', 'b.yml']);

      expect(result.configFiles).toEqual([
        { path: 'a.yml', mode: 'auto' },
        { path: 'b.yml', mode: 'auto' },
      ]);
    });

    it('collects repeated --json options', () => {
      const result = CliArgumentsParser.parse(['--json', 'a.json', '--json', 'b.json']);

      expect(result.configFiles).toEqual([
        { path: 'a.json', mode: 'json' },
        { path: 'b.json', mode: 'json' },
      ]);
    });

    it('collects repeated --yaml options', () => {
      const result = CliArgumentsParser.parse(['--yaml', 'a.yml', '--yaml', 'b.yml']);

      expect(result.configFiles).toEqual([
        { path: 'a.yml', mode: 'yaml' },
        { path: 'b.yml', mode: 'yaml' },
      ]);
    });

    it('combines --file/--json/--yaml, preserving literal command-line order', () => {
      const result = CliArgumentsParser.parse([
        '--file', 'a.yml',
        '--json', 'b.json',
        '--file', 'c.yml',
        '--yaml', 'd.yml',
      ]);

      expect(result.configFiles).toEqual([
        { path: 'a.yml', mode: 'auto' },
        { path: 'b.json', mode: 'json' },
        { path: 'c.yml', mode: 'auto' },
        { path: 'd.yml', mode: 'yaml' },
      ]);
    });

    it('ignores non-config-file options when reconstructing configFiles order', () => {
      const result = CliArgumentsParser.parse([
        '--file', 'a.yml',
        '--base-url', 'http://example.com',
        '--json', 'b.json',
      ]);

      expect(result.configFiles).toEqual([
        { path: 'a.yml', mode: 'auto' },
        { path: 'b.json', mode: 'json' },
      ]);
    });
  });
});
