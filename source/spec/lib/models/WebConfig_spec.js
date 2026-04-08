import { WebConfig } from '../../../lib/models/WebConfig.js';

describe('WebConfig', () => {
  describe('constructor', () => {
    it('stores port', () => {
      const config = new WebConfig({ port: 3000 });
      expect(config.port).toEqual(3000);
    });
  });
});
