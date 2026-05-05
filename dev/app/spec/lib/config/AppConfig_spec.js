import { AppConfig } from '../../../lib/config/AppConfig.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

const configFixturePath = FixturesUtils.getFixturePath('config.yml');

describe('AppConfig', () => {
  afterEach(() => {
    AppConfig.reset();
  });

  describe('.load', () => {
    describe('when the config file exists', () => {
      it('loads the json section from the file', () => {
        AppConfig.load(configFixturePath);
        expect(AppConfig.json.pageSize).toBe(3);
      });
    });

    describe('when the config file does not exist', () => {
      beforeEach(() => {
        spyOn(console, 'warn');
      });

      it('falls back to defaults', () => {
        AppConfig.load('/nonexistent/config.yml');
        expect(AppConfig.json.pageSize).toBe(5);
      });

      it('logs a warning', () => {
        AppConfig.load('/nonexistent/config.yml');
        expect(console.warn).toHaveBeenCalledWith(
          jasmine.stringContaining('/nonexistent/config.yml')
        );
      });
    });
  });

  describe('.json', () => {
    describe('when no config has been loaded', () => {
      it('returns a JsonConfig with default values', () => {
        expect(AppConfig.json.pageSize).toBe(5);
      });
    });

    describe('after loading a config', () => {
      it('returns the loaded configuration', () => {
        AppConfig.load(configFixturePath);
        expect(AppConfig.json.pageSize).toBe(3);
      });
    });
  });

  describe('constructor', () => {
    it('exposes json as an instance accessor', () => {
      const config = new AppConfig({ json: { pageSize: 8 } });
      expect(config.json.pageSize).toBe(8);
    });
  });
});
