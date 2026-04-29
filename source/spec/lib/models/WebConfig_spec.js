import { WebConfig } from '../../../lib/models/WebConfig.js';

describe('WebConfig', () => {
  describe('constructor', () => {
    it('stores port', () => {
      const config = new WebConfig({ port: 3000 });
      expect(config.port).toEqual(3000);
    });

    it('defaults logsPageSize to 20', () => {
      const config = new WebConfig({ port: 3000 });
      expect(config.logsPageSize).toEqual(20);
    });

    it('stores a custom logsPageSize', () => {
      const config = new WebConfig({ port: 3000, logs_page_size: 50 });
      expect(config.logsPageSize).toEqual(50);
    });
  });
});
