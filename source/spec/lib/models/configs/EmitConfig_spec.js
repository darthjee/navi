import { EmitConfig } from '../../../../lib/models/configs/EmitConfig.js';

describe('EmitConfig', () => {
  describe('#constructor', () => {
    describe('when a full config object is provided', () => {
      it('should create an instance with the custom size', () => {
        const config = new EmitConfig({ size: 200 });
        expect(config.size).toBe(200);
      });
    });

    describe('when a partial config object is provided', () => {
      it('should create an instance with the default size', () => {
        const config = new EmitConfig({});
        expect(config.size).toBe(100);
      });
    });

    describe('when no config object is provided', () => {
      it('should create an instance with the default size', () => {
        const config = new EmitConfig();
        expect(config.size).toBe(100);
      });
    });
  });

  describe('.fromObject', () => {
    describe('when a config object is provided', () => {
      it('returns an EmitConfig with the given size', () => {
        const config = EmitConfig.fromObject({ size: 50 });
        expect(config.size).toBe(50);
      });
    });

    describe('when null is provided', () => {
      it('returns an EmitConfig with the default size', () => {
        const config = EmitConfig.fromObject(null);
        expect(config.size).toBe(100);
      });
    });

    describe('when undefined is provided', () => {
      it('returns an EmitConfig with the default size', () => {
        const config = EmitConfig.fromObject(undefined);
        expect(config.size).toBe(100);
      });
    });
  });
});
