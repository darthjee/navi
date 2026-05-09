import { WebConfig } from '../../../../lib/models/configs/WebConfig.js';

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

    it('defaults enableShutdown to true', () => {
      const config = new WebConfig({ port: 3000 });
      expect(config.enableShutdown).toEqual(true);
    });

    it('stores enableShutdown as false', () => {
      const config = new WebConfig({ port: 3000, enable_shutdown: false });
      expect(config.enableShutdown).toEqual(false);
    });

    it('defaults links to an empty list', () => {
      const config = new WebConfig({ port: 3000 });
      expect(config.links).toEqual([]);
    });

    it('maps links from string and object entries', () => {
      const config = new WebConfig({
        port: 3000,
        links: [
          'https://example.com',
          { text: 'Docs', url: 'https://example.com/docs' },
        ],
      });

      expect(config.links.map((link) => link.toJSON())).toEqual([
        { text: 'https://example.com', url: 'https://example.com' },
        { text: 'Docs', url: 'https://example.com/docs' },
      ]);
    });
  });
});
