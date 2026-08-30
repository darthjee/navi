import { Config } from '../../../../lib/models/configs/Config.js';
import { ExtractionConfig } from '../../../../lib/models/configs/ExtractionConfig.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';

describe('Config', () => {
  afterEach(() => {
    NamespaceMap.reset();
  });

  describe('#extractionConfig', () => {
    describe('when no extractionConfig is provided', () => {
      it('defaults to an ExtractionConfig with the default size', () => {
        const config = new Config({ namespaceMap: {} });

        expect(config.extractionConfig).toBeInstanceOf(ExtractionConfig);
        expect(config.extractionConfig.size).toBe(100);
      });
    });

    describe('when an extractionConfig is provided', () => {
      it('keeps the provided instance', () => {
        const extractionConfig = new ExtractionConfig({ size: 7 });
        const config = new Config({ namespaceMap: {}, extractionConfig });

        expect(config.extractionConfig).toBe(extractionConfig);
        expect(config.extractionConfig.size).toBe(7);
      });
    });
  });
});
