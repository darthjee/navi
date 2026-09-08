import { ConfigStore } from '../../../../lib/services/application/ConfigStore.js';

describe('ConfigStore', () => {
  const config = { workersConfig: { sleep: 10 } };
  const bufferedLogger = { flush: () => {} };
  const entryFilePath = './config/navi.yml';

  let store;

  beforeEach(() => {
    store = new ConfigStore({ config, bufferedLogger, entryFilePath });
  });

  describe('#config', () => {
    it('returns the config passed to the constructor', () => {
      expect(store.config).toBe(config);
    });
  });

  describe('#bufferedLogger', () => {
    it('returns the buffered logger passed to the constructor', () => {
      expect(store.bufferedLogger).toBe(bufferedLogger);
    });
  });

  describe('#entryFilePath', () => {
    it('returns the entry file path passed to the constructor', () => {
      expect(store.entryFilePath).toBe(entryFilePath);
    });

    it('returns a relative path unchanged, without resolving or normalizing it', () => {
      const relativeStore = new ConfigStore({
        config,
        bufferedLogger,
        entryFilePath: '../foo/./bar/navi.yml',
      });

      expect(relativeStore.entryFilePath).toBe('../foo/./bar/navi.yml');
    });
  });

  describe('#menuConfig', () => {
    it('defaults to an empty list when not provided', () => {
      expect(store.menuConfig).toEqual([]);
    });

    it('returns the menu entries passed to the constructor', () => {
      const menuConfig = [{ route: '/logs', text: 'Logs' }];
      const menuStore = new ConfigStore({ config, bufferedLogger, entryFilePath, menuConfig });

      expect(menuStore.menuConfig).toBe(menuConfig);
    });
  });
});
