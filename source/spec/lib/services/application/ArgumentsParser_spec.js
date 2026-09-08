import { ArgumentsParser, DEFAULT_CONFIG_FILE, DEFAULT_MENU_FILE } from '../../../../lib/services/application/ArgumentsParser.js';

describe('ArgumentsParser', () => {
  describe('.parse', () => {
    describe('when no arguments are provided', () => {
      it('returns the default config file', () => {
        expect(ArgumentsParser.parse([]))
          .toEqual({ config: DEFAULT_CONFIG_FILE, menu: DEFAULT_MENU_FILE });
      });
    });

    describe('when -c is provided with a path', () => {
      it('returns the given config file', () => {
        expect(ArgumentsParser.parse(['-c', 'custom/config.yml']))
          .toEqual({ config: 'custom/config.yml', menu: DEFAULT_MENU_FILE });
      });
    });

    describe('when --config= is provided with a path', () => {
      it('returns the given config file', () => {
        expect(ArgumentsParser.parse(['--config=custom/config.yml']))
          .toEqual({ config: 'custom/config.yml', menu: DEFAULT_MENU_FILE });
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

    describe('when -m is provided with a path', () => {
      it('returns the given menu file', () => {
        expect(ArgumentsParser.parse(['-m', 'custom/menu.yml']))
          .toEqual({ config: DEFAULT_CONFIG_FILE, menu: 'custom/menu.yml' });
      });
    });

    describe('when --menu= is provided with a path', () => {
      it('returns the given menu file', () => {
        expect(ArgumentsParser.parse(['--menu=custom/menu.yml']))
          .toEqual({ config: DEFAULT_CONFIG_FILE, menu: 'custom/menu.yml' });
      });
    });

    describe('when -m is provided without a value', () => {
      it('throws an error', () => {
        expect(() => ArgumentsParser.parse(['-m'])).toThrowError(TypeError);
      });
    });

    describe('when -m is followed by another flag', () => {
      it('throws an error', () => {
        expect(() => ArgumentsParser.parse(['-m', '--other-flag'])).toThrowError(TypeError);
      });
    });
  });
});
