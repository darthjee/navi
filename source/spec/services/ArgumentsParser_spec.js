import { ArgumentsParser, DEFAULT_CONFIG_FILE } from '../../lib/services/ArgumentsParser.js';

describe('ArgumentsParser', () => {
  describe('.parse', () => {
    describe('when no arguments are provided', () => {
      it('returns the default config file', () => {
        expect(ArgumentsParser.parse([])).toEqual({ configFile: DEFAULT_CONFIG_FILE });
      });
    });

    describe('when -c is provided with a path', () => {
      it('returns the given config file', () => {
        expect(ArgumentsParser.parse(['-c', 'custom/config.yml']))
          .toEqual({ configFile: 'custom/config.yml' });
      });
    });

    describe('when --config= is provided with a path', () => {
      it('returns the given config file', () => {
        expect(ArgumentsParser.parse(['--config=custom/config.yml']))
          .toEqual({ configFile: 'custom/config.yml' });
      });
    });

    describe('when -c is provided without a value', () => {
      let exitSpy;
      let errorSpy;

      beforeEach(() => {
        exitSpy = spyOn(process, 'exit');
        errorSpy = spyOn(console, 'error');
      });

      it('logs an error message', () => {
        ArgumentsParser.parse(['-c']);

        expect(errorSpy).toHaveBeenCalledWith('Error: -c option requires a config file path');
      });

      it('exits with a non-zero code', () => {
        ArgumentsParser.parse(['-c']);

        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    describe('when -c is followed by another flag', () => {
      let exitSpy;
      let errorSpy;

      beforeEach(() => {
        exitSpy = spyOn(process, 'exit');
        errorSpy = spyOn(console, 'error');
      });

      it('logs an error message', () => {
        ArgumentsParser.parse(['-c', '--other-flag']);

        expect(errorSpy).toHaveBeenCalledWith('Error: -c option requires a config file path');
      });

      it('exits with a non-zero code', () => {
        ArgumentsParser.parse(['-c', '--other-flag']);

        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });

    describe('when --config= is provided without a value', () => {
      let exitSpy;
      let errorSpy;

      beforeEach(() => {
        exitSpy = spyOn(process, 'exit');
        errorSpy = spyOn(console, 'error');
      });

      it('logs an error message', () => {
        ArgumentsParser.parse(['--config=']);

        expect(errorSpy).toHaveBeenCalledWith('Error: --config option requires a config file path');
      });

      it('exits with a non-zero code', () => {
        ArgumentsParser.parse(['--config=']);

        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
