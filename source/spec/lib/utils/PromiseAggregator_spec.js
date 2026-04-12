import { PromiseAggregator } from '../../../lib/utils/PromiseAggregator.js';

describe('PromiseAggregator', () => {
  let aggregator;

  beforeEach(() => {
    aggregator = new PromiseAggregator();
  });

  describe('#add', () => {
    it('registers promises', () => {
      const promise = Promise.resolve();

      expect(() => aggregator.add(promise)).not.toThrow();
    });

    it('silently ignores null', () => {
      expect(() => aggregator.add(null)).not.toThrow();
    });

    it('silently ignores undefined', () => {
      expect(() => aggregator.add(undefined)).not.toThrow();
    });
  });

  describe('#wait', () => {
    describe('when no promises have been added', () => {
      it('resolves immediately', async () => {
        await expectAsync(aggregator.wait()).toBeResolved();
      });
    });

    describe('when all promises resolve', () => {
      it('resolves only after all added promises resolve', async () => {
        let resolved1 = false;
        let resolved2 = false;

        const promise1 = new Promise((resolve) => {
          setTimeout(() => {
            resolved1 = true;
            resolve();
          }, 10);
        });

        const promise2 = new Promise((resolve) => {
          setTimeout(() => {
            resolved2 = true;
            resolve();
          }, 20);
        });

        aggregator.add(promise1);
        aggregator.add(promise2);

        await aggregator.wait();

        expect(resolved1).toBeTrue();
        expect(resolved2).toBeTrue();
      });
    });

    describe('when one promise rejects', () => {
      it('waits for all promises to settle then re-throws the first rejection', async () => {
        let resolved = false;
        const error = new Error('test rejection');

        const promise1 = Promise.reject(error);

        const promise2 = new Promise((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve();
          }, 10);
        });

        aggregator.add(promise1);
        aggregator.add(promise2);

        await expectAsync(aggregator.wait()).toBeRejectedWith(error);
        expect(resolved).toBeTrue();
      });
    });

    describe('when null and undefined are added alongside real promises', () => {
      it('resolves after the real promises resolve', async () => {
        let resolved = false;

        const promise = new Promise((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve();
          }, 10);
        });

        aggregator.add(null);
        aggregator.add(promise);
        aggregator.add(undefined);

        await aggregator.wait();

        expect(resolved).toBeTrue();
      });
    });
  });
});
