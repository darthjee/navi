import path from 'path';
import { ExtensionsEnv } from '../../../../lib/server/extensions/ExtensionsEnv.js';

describe('ExtensionsEnv', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('.enabled', () => {
    const truthy = ['1', 'true', 'yes', 'on', ' TRUE ', ' Yes '];
    const falsey = [undefined, '', '0', 'false', 'no', 'off', 'maybe'];

    truthy.forEach((value) => {
      it(`is true for ${JSON.stringify(value)}`, () => {
        process.env.NAVI_EXTENSIONS_ENABLED = value;

        expect(ExtensionsEnv.enabled).toBe(true);
      });
    });

    falsey.forEach((value) => {
      it(`is false for ${JSON.stringify(value)}`, () => {
        if (value === undefined) {
          delete process.env.NAVI_EXTENSIONS_ENABLED;
        } else {
          process.env.NAVI_EXTENSIONS_ENABLED = value;
        }

        expect(ExtensionsEnv.enabled).toBe(false);
      });
    });

    it('reads process.env on every access', () => {
      delete process.env.NAVI_EXTENSIONS_ENABLED;
      expect(ExtensionsEnv.enabled).toBe(false);

      process.env.NAVI_EXTENSIONS_ENABLED = 'true';
      expect(ExtensionsEnv.enabled).toBe(true);
    });
  });

  describe('.dir', () => {
    it('defaults to /navi/extensions when unset', () => {
      delete process.env.NAVI_EXTENSIONS_DIR;

      expect(ExtensionsEnv.dir).toBe('/navi/extensions');
    });

    it('defaults to /navi/extensions when empty', () => {
      process.env.NAVI_EXTENSIONS_DIR = '';

      expect(ExtensionsEnv.dir).toBe('/navi/extensions');
    });

    it('uses the override when set', () => {
      process.env.NAVI_EXTENSIONS_DIR = '/custom/ext';

      expect(ExtensionsEnv.dir).toBe('/custom/ext');
    });
  });

  describe('.backendDir', () => {
    it('joins the dir with backend', () => {
      process.env.NAVI_EXTENSIONS_DIR = '/custom/ext';

      expect(ExtensionsEnv.backendDir).toBe(path.join('/custom/ext', 'backend'));
    });

    it('joins the default dir with backend', () => {
      delete process.env.NAVI_EXTENSIONS_DIR;

      expect(ExtensionsEnv.backendDir).toBe('/navi/extensions/backend');
    });
  });
});
