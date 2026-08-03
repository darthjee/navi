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
      });
    });

    it('leaves options undefined when not given', () => {
      const result = CliArgumentsParser.parse([]);

      expect(result).toEqual({
        baseUrl: undefined,
        token: undefined,
        action: undefined,
        payload: undefined,
      });
    });
  });
});
