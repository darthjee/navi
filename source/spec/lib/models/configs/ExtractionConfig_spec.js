import { ExtractionConfig } from '../../../../lib/models/configs/ExtractionConfig.js';

describe('ExtractionConfig', () => {
  describe('#constructor', () => {
    describe('when a full config object is provided', () => {
      it('should create an instance with the custom size', () => {
        const config = new ExtractionConfig({ size: 200 });
        expect(config.size).toBe(200);
      });
    });

    describe('when a partial config object is provided', () => {
      it('should create an instance with the default size', () => {
        const config = new ExtractionConfig({});
        expect(config.size).toBe(100);
      });
    });

    describe('when no config object is provided', () => {
      it('should create an instance with the default size', () => {
        const config = new ExtractionConfig();
        expect(config.size).toBe(100);
      });
    });
  });

  describe('.fromObject', () => {
    describe('when a config object is provided', () => {
      it('returns an ExtractionConfig with the given size', () => {
        const config = ExtractionConfig.fromObject({ size: 50 });
        expect(config.size).toBe(50);
      });
    });

    describe('when null is provided', () => {
      it('returns an ExtractionConfig with the default size', () => {
        const config = ExtractionConfig.fromObject(null);
        expect(config.size).toBe(100);
      });
    });

    describe('when undefined is provided', () => {
      it('returns an ExtractionConfig with the default size', () => {
        const config = ExtractionConfig.fromObject(undefined);
        expect(config.size).toBe(100);
      });
    });
  });
});
