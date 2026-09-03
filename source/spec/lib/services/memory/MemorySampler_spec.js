import { MemoryConfig } from '../../../../lib/models/configs/MemoryConfig.js';
import { MemoryRegistry } from '../../../../lib/registry/MemoryRegistry.js';
import { MemorySampler } from '../../../../lib/services/memory/MemorySampler.js';

describe('MemorySampler', () => {
  let sampler;
  let memoryConfig;
  let rssReader;
  let setIntervalSpy;
  let clearIntervalSpy;
  let unrefSpy;
  let handle;
  let capturedCallback;
  let capturedDelay;

  const dummyResolver = (value) => ({ resolve: () => value });

  beforeEach(() => {
    MemoryRegistry.build();

    memoryConfig = new MemoryConfig(
      { data_store: { interval: 10 } },
      { resolver: dummyResolver(1000) }
    );

    rssReader = { read: jasmine.createSpy('read').and.returnValue(500) };

    unrefSpy = jasmine.createSpy('unref');
    handle = { unref: unrefSpy };

    setIntervalSpy = jasmine.createSpy('setInterval').and.callFake((callback, delay) => {
      capturedCallback = callback;
      capturedDelay = delay;
      return handle;
    });
    clearIntervalSpy = jasmine.createSpy('clearInterval');

    sampler = new MemorySampler(memoryConfig, {
      setInterval: setIntervalSpy,
      clearInterval: clearIntervalSpy,
      rssReader
    });
  });

  afterEach(() => {
    MemoryRegistry.reset();
  });

  describe('#start', () => {
    it('takes one immediate synchronous sample before arming the interval', () => {
      spyOn(MemoryRegistry, 'add');

      sampler.start();

      expect(MemoryRegistry.add).toHaveBeenCalledTimes(1);
      expect(MemoryRegistry.add).toHaveBeenCalledWith(500, 50);
    });

    it('arms the interval with dataStoreInterval seconds converted to ms', () => {
      sampler.start();

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(capturedDelay).toBe(10000);
    });

    it('unrefs the interval handle', () => {
      sampler.start();

      expect(unrefSpy).toHaveBeenCalled();
    });

    it('records one MemoryRegistry.add per manual tick', () => {
      spyOn(MemoryRegistry, 'add');
      sampler.start();
      MemoryRegistry.add.calls.reset();

      capturedCallback();

      expect(MemoryRegistry.add).toHaveBeenCalledTimes(1);
    });

    it('no-ops on a second start (setInterval called once)', () => {
      sampler.start();
      sampler.start();

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    describe('when rssReader throws', () => {
      it('swallows the error on the immediate sample without throwing', () => {
        rssReader.read.and.throwError('boom');

        expect(() => sampler.start()).not.toThrow();
      });

      it('does not clear the handle and the next tick still records', () => {
        sampler.start();
        rssReader.read.and.throwError('boom');

        expect(() => capturedCallback()).not.toThrow();
        expect(clearIntervalSpy).not.toHaveBeenCalled();

        rssReader.read.and.returnValue(500);
        spyOn(MemoryRegistry, 'add');
        capturedCallback();

        expect(MemoryRegistry.add).toHaveBeenCalledWith(500, 50);
      });
    });
  });

  describe('#stop', () => {
    it('clears the interval handle', () => {
      sampler.start();

      sampler.stop();

      expect(clearIntervalSpy).toHaveBeenCalledWith(handle);
    });

    it('is idempotent (a second stop no-ops)', () => {
      sampler.start();
      sampler.stop();

      sampler.stop();

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('does not throw when called before start', () => {
      expect(() => sampler.stop()).not.toThrow();
    });
  });
});
