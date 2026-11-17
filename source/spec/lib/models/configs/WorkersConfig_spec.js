import { WorkersConfig } from '../../../../lib/models/configs/WorkersConfig.js';

describe('WorkersConfig', () => {
  describe('#constructor', () => {
    describe('when a full config object is provided', () => {
      it('should create an instance with custom quantity', () => {
        const config = new WorkersConfig({ quantity: 5 });
        expect(config.quantity).toBe(5);
      });

      it('should create an instance with custom retry_cooldown', () => {
        const config = new WorkersConfig({ quantity: 5, retry_cooldown: 3000 });
        expect(config.retryCooldown).toBe(3000);
      });

      it('should create an instance with custom sleep', () => {
        const config = new WorkersConfig({ sleep: 200 });
        expect(config.sleep).toBe(200);
      });

      it('should create an instance with custom max-retries', () => {
        const config = new WorkersConfig({ 'max-retries': 5 });
        expect(config.maxRetries).toBe(5);
      });
    });

    describe('when a partial config object is provided', () => {
      it('should create an instance with default quantity', () => {
        const config = new WorkersConfig({});
        expect(config.quantity).toBe(1);
      });

      it('should create an instance with default retryCooldown', () => {
        const config = new WorkersConfig({});
        expect(config.retryCooldown).toBe(2000);
      });

      it('should create an instance with default sleep', () => {
        const config = new WorkersConfig({});
        expect(config.sleep).toBe(500);
      });

      it('should create an instance with default maxRetries', () => {
        const config = new WorkersConfig({});
        expect(config.maxRetries).toBe(3);
      });
    });

    describe('retention', () => {
      const retentionOf = (retention) => new WorkersConfig({ retention }).retention;

      it('is undefined when absent', () => {
        expect(new WorkersConfig({}).retention).toBeUndefined();
      });

      it('keeps only finished', () => {
        const retention = retentionOf({ finished: 100 });
        expect(retention).toEqual({ finished: 100 });
        expect(Object.keys(retention)).toEqual(['finished']);
      });

      it('keeps only dead', () => {
        const retention = retentionOf({ dead: 50 });
        expect(retention).toEqual({ dead: 50 });
        expect(Object.keys(retention)).toEqual(['dead']);
      });

      it('keeps both', () => {
        expect(retentionOf({ finished: 100, dead: 50 })).toEqual({ finished: 100, dead: 50 });
      });

      it('is undefined when null', () => {
        expect(retentionOf(null)).toBeUndefined();
      });

      it('is undefined when all values are null', () => {
        expect(retentionOf({ finished: null, dead: null })).toBeUndefined();
      });

      it('drops null values only', () => {
        expect(retentionOf({ finished: 100, dead: null })).toEqual({ finished: 100 });
      });

      it('keeps zero', () => {
        expect(retentionOf({ finished: 0 })).toEqual({ finished: 0 });
      });

      it('preserves unknown keys', () => {
        expect(retentionOf({ finshed: 1 })).toEqual({ finshed: 1 });
      });
    });

    describe('when no config object is provided', () => {
      it('should create an instance with default quantity', () => {
        const config = new WorkersConfig();
        expect(config.quantity).toBe(1);
      });

      it('should create an instance with default retryCooldown', () => {
        const config = new WorkersConfig();
        expect(config.retryCooldown).toBe(2000);
      });

      it('should create an instance with default sleep', () => {
        const config = new WorkersConfig();
        expect(config.sleep).toBe(500);
      });

      it('should create an instance with default maxRetries', () => {
        const config = new WorkersConfig();
        expect(config.maxRetries).toBe(3);
      });
    });
  });
});
