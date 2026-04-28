import { FailureConfig } from '../../../lib/models/FailureConfig.js';

describe('FailureConfig', () => {
  describe('#constructor', () => {
    it('creates an instance with the given threshold', () => {
      const config = new FailureConfig({ threshold: 10.0 });
      expect(config.threshold).toBe(10.0);
    });
  });

  describe('.fromObject', () => {
    describe('when a config object is provided', () => {
      it('returns a FailureConfig with the given threshold', () => {
        const config = FailureConfig.fromObject({ threshold: 25.0 });
        expect(config instanceof FailureConfig).toBeTrue();
        expect(config.threshold).toBe(25.0);
      });
    });

    describe('when null is provided', () => {
      it('returns null', () => {
        expect(FailureConfig.fromObject(null)).toBeNull();
      });
    });

    describe('when undefined is provided', () => {
      it('returns null', () => {
        expect(FailureConfig.fromObject(undefined)).toBeNull();
      });
    });
  });
});
