import { ArgumentsParser, DEFAULT_CONFIG_FILE } from '../../lib/services/ArgumentsParser.js';

describe('ArgumentsParser', () => {
  describe('.parse', () => {
    describe('when no arguments are provided', () => {
      it('returns the default config file', () => {
        expect(ArgumentsParser.parse([])).toEqual({ config: DEFAULT_CONFIG_FILE });
      });
    });

    describe('when -c is provided with a path', () => {
      it('returns the given config file', () => {
        expect(ArgumentsParser.parse(['-c', 'custom/config.yml']))
          .toEqual({ config: 'custom/config.yml' });
      });
    });

    describe('when --config= is provided with a path', () => {
      it('returns the given config file', () => {
        expect(ArgumentsParser.parse(['--config=custom/config.yml']))
          .toEqual({ config: 'custom/config.yml' });
      });
    });

    describe('when -c is provided without a value', () => {
      it('throws an error', () => {
        expect(() => ArgumentsParser.parse(['-c'])).toThrowError(TypeError);
      });
    });

    describe('when -c is followed by another flag', () => {

      it('throws an error', () => {
        expect(() => ArgumentsParser.parse(['-c', '--other-flag'])).toThrowError(TypeError);
      });
    });
  });
});
