import { DEFAULT_CONFIG_PATH, parseConfigPath } from '../navi.js';

describe('navi CLI', () => {
  describe('parseConfigPath', () => {
    describe('when no arguments are provided', () => {
      it('returns the default config path', () => {
        expect(parseConfigPath([])).toEqual(DEFAULT_CONFIG_PATH);
      });
    });

    describe('when -c is provided with a path', () => {
      it('returns the given config path', () => {
        expect(parseConfigPath(['-c', 'custom/config.yml'])).toEqual('custom/config.yml');
      });
    });

    describe('when --config= is provided with a path', () => {
      it('returns the given config path', () => {
        expect(parseConfigPath(['--config=custom/config.yml'])).toEqual('custom/config.yml');
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
        parseConfigPath(['-c']);

        expect(errorSpy).toHaveBeenCalledWith('Error: -c option requires a config file path');
      });

      it('exits with a non-zero code', () => {
        parseConfigPath(['-c']);

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
        parseConfigPath(['-c', '--other-flag']);

        expect(errorSpy).toHaveBeenCalledWith('Error: -c option requires a config file path');
      });

      it('exits with a non-zero code', () => {
        parseConfigPath(['-c', '--other-flag']);

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
        parseConfigPath(['--config=']);

        expect(errorSpy).toHaveBeenCalledWith('Error: --config option requires a config file path');
      });

      it('exits with a non-zero code', () => {
        parseConfigPath(['--config=']);

        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    });
  });
});
