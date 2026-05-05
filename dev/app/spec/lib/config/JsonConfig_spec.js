import { JsonConfig } from '../../../lib/config/JsonConfig.js';

describe('JsonConfig', () => {
  describe('#pageSize', () => {
    describe('when pageSize is provided', () => {
      it('returns the configured value', () => {
        const config = new JsonConfig({ pageSize: 10 });
        expect(config.pageSize).toBe(10);
      });

      it('parses string values', () => {
        const config = new JsonConfig({ pageSize: '7' });
        expect(config.pageSize).toBe(7);
      });
    });

    describe('when pageSize is absent', () => {
      it('returns the default value of 5', () => {
        const config = new JsonConfig({});
        expect(config.pageSize).toBe(5);
      });

      it('also defaults when constructed with no arguments', () => {
        const config = new JsonConfig();
        expect(config.pageSize).toBe(5);
      });
    });

    describe('when pageSize cannot be parsed', () => {
      it('returns the default value of 5', () => {
        const config = new JsonConfig({ pageSize: 'notanumber' });
        expect(config.pageSize).toBe(5);
      });
    });

    describe('when pageSize is zero or negative', () => {
      it('returns the default value of 5 for zero', () => {
        const config = new JsonConfig({ pageSize: 0 });
        expect(config.pageSize).toBe(5);
      });

      it('returns the default value of 5 for negative', () => {
        const config = new JsonConfig({ pageSize: -3 });
        expect(config.pageSize).toBe(5);
      });
    });

    describe('when pageSize is an environment variable reference', () => {
      beforeEach(() => {
        process.env.JSON_PAGE_SIZE = '20';
      });

      afterEach(() => {
        delete process.env.JSON_PAGE_SIZE;
      });

      it('resolves the env var and uses its value', () => {
        const config = new JsonConfig({ pageSize: '$JSON_PAGE_SIZE' });
        expect(config.pageSize).toBe(20);
      });
    });
  });
});
