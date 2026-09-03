import { InvalidMemoryDataStore } from '../../../../lib/exceptions/config/InvalidMemoryDataStore.js';
import { InvalidMemoryThresholds } from '../../../../lib/exceptions/config/InvalidMemoryThresholds.js';
import { MemoryConfig } from '../../../../lib/models/configs/MemoryConfig.js';

describe('MemoryConfig', () => {
  const dummyResolver = (value) => ({ resolve: () => value });

  describe('constructor', () => {
    describe('thresholds', () => {
      it('defaults thresholds when none are given', () => {
        const config = new MemoryConfig();

        expect(config.thresholds).toEqual({ low: 25.0, medium: 50.0, high: 75.0, over: 100.0 });
      });

      it('applies a partial override without dropping the remaining defaults', () => {
        const config = new MemoryConfig({ thresholds: { medium: 40.0 } });

        expect(config.thresholds).toEqual({ low: 25.0, medium: 40.0, high: 75.0, over: 100.0 });
      });

      it('accepts a fully custom, strictly ascending set of thresholds', () => {
        const config = new MemoryConfig({ thresholds: { low: 10.0, medium: 20.0, high: 30.0, over: 40.0 } });

        expect(config.thresholds).toEqual({ low: 10.0, medium: 20.0, high: 30.0, over: 40.0 });
      });

      it('throws InvalidMemoryThresholds when low is not strictly less than medium', () => {
        expect(() => new MemoryConfig({ thresholds: { low: 50.0, medium: 50.0 } }))
          .toThrowError(InvalidMemoryThresholds);
      });

      it('throws InvalidMemoryThresholds when medium is not strictly less than high', () => {
        expect(() => new MemoryConfig({ thresholds: { medium: 80.0, high: 75.0 } }))
          .toThrowError(InvalidMemoryThresholds);
      });

      it('throws InvalidMemoryThresholds when high is not strictly less than over', () => {
        expect(() => new MemoryConfig({ thresholds: { high: 100.0, over: 100.0 } }))
          .toThrowError(InvalidMemoryThresholds);
      });
    });

    describe('maximum', () => {
      it('resolves maximum via the injected resolver', () => {
        const config = new MemoryConfig({ maximum: 2048 }, { resolver: dummyResolver(4096) });

        expect(config.maximum).toEqual(4096);
      });

      it('passes the raw configured maximum through to the resolver', () => {
        const resolve = jasmine.createSpy('resolve').and.returnValue(8192);

        const config = new MemoryConfig({ maximum: 2048 }, { resolver: { resolve } });

        expect(resolve).toHaveBeenCalledWith(2048);
        expect(config.maximum).toEqual(8192);
      });
    });

    describe('data_store', () => {
      it('defaults dataStoreSize to 100 when none is given', () => {
        const config = new MemoryConfig();

        expect(config.dataStoreSize).toBe(100);
      });

      it('defaults dataStoreInterval to 5 when none is given', () => {
        const config = new MemoryConfig();

        expect(config.dataStoreInterval).toBe(5);
      });

      it('defaults dataStorePageSize to 20 when none is given', () => {
        const config = new MemoryConfig();

        expect(config.dataStorePageSize).toBe(20);
      });

      it('applies a custom data_store.size', () => {
        const config = new MemoryConfig({ data_store: { size: 250 } });

        expect(config.dataStoreSize).toBe(250);
      });

      it('applies a custom data_store.interval', () => {
        const config = new MemoryConfig({ data_store: { interval: 10 } });

        expect(config.dataStoreInterval).toBe(10);
      });

      it('applies a custom data_store.page_size', () => {
        const config = new MemoryConfig({ data_store: { page_size: 50 } });

        expect(config.dataStorePageSize).toBe(50);
      });

      it('accepts a fractional data_store.interval', () => {
        const config = new MemoryConfig({ data_store: { interval: 0.5 } });

        expect(config.dataStoreInterval).toBe(0.5);
      });

      it('does not interfere with maximum/thresholds behavior', () => {
        const config = new MemoryConfig(
          { data_store: { size: 250 }, thresholds: { medium: 40.0 } },
          { resolver: dummyResolver(4096) }
        );

        expect(config.dataStoreSize).toBe(250);
        expect(config.maximum).toEqual(4096);
        expect(config.thresholds).toEqual({ low: 25.0, medium: 40.0, high: 75.0, over: 100.0 });
      });

      it('throws InvalidMemoryDataStore when interval is 0', () => {
        expect(() => new MemoryConfig({ data_store: { interval: 0 } }))
          .toThrowError(InvalidMemoryDataStore);
      });

      it('throws InvalidMemoryDataStore when interval is negative', () => {
        expect(() => new MemoryConfig({ data_store: { interval: -5 } }))
          .toThrowError(InvalidMemoryDataStore);
      });

      it('throws InvalidMemoryDataStore when interval is NaN', () => {
        expect(() => new MemoryConfig({ data_store: { interval: NaN } }))
          .toThrowError(InvalidMemoryDataStore);
      });

      it('throws InvalidMemoryDataStore when interval is non-numeric', () => {
        expect(() => new MemoryConfig({ data_store: { interval: 'oops' } }))
          .toThrowError(InvalidMemoryDataStore);
      });

      it('does not validate size/page_size, allowing values that would otherwise be nonsensical (deliberate asymmetry with interval)', () => {
        const config = new MemoryConfig({ data_store: { size: -1, page_size: 0 } });

        expect(config.dataStoreSize).toBe(-1);
        expect(config.dataStorePageSize).toBe(0);
      });
    });
  });

  describe('#statusFor', () => {
    let config;

    beforeEach(() => {
      config = new MemoryConfig({ thresholds: { low: 25.0, medium: 50.0, high: 75.0, over: 100.0 } }, { resolver: dummyResolver(1024) });
    });

    it('returns "low" below the low threshold', () => {
      expect(config.statusFor(10.0)).toEqual('low');
    });

    it('returns "low" exactly at the low threshold', () => {
      expect(config.statusFor(25.0)).toEqual('low');
    });

    it('returns "low" just below the medium threshold', () => {
      expect(config.statusFor(49.9)).toEqual('low');
    });

    it('returns "medium" exactly at the medium threshold', () => {
      expect(config.statusFor(50.0)).toEqual('medium');
    });

    it('returns "medium" just below the high threshold', () => {
      expect(config.statusFor(74.9)).toEqual('medium');
    });

    it('returns "high" exactly at the high threshold', () => {
      expect(config.statusFor(75.0)).toEqual('high');
    });

    it('returns "high" just below the over threshold', () => {
      expect(config.statusFor(99.9)).toEqual('high');
    });

    it('returns "over" exactly at the over threshold', () => {
      expect(config.statusFor(100.0)).toEqual('over');
    });

    it('returns "over" above the over threshold', () => {
      expect(config.statusFor(150.0)).toEqual('over');
    });
  });
});
