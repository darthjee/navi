import { EngineEvents } from '../../../lib/services/EngineEvents.js';

describe('EngineEvents', () => {
  afterEach(() => {
    EngineEvents.reset();
  });

  describe('.on and .emit', () => {
    it('calls the registered listener when the event fires', () => {
      const handler = jasmine.createSpy('handler');
      EngineEvents.on('stop', handler);
      EngineEvents.emit('stop');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not call the listener for a different event', () => {
      const handler = jasmine.createSpy('handler');
      EngineEvents.on('stop', handler);
      EngineEvents.emit('start');
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls multiple listeners for the same event', () => {
      const handler1 = jasmine.createSpy('handler1');
      const handler2 = jasmine.createSpy('handler2');
      EngineEvents.on('stop', handler1);
      EngineEvents.on('stop', handler2);
      EngineEvents.emit('stop');
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('does not call a listener registered after the emit', () => {
      const handler = jasmine.createSpy('handler');
      EngineEvents.emit('stop');
      EngineEvents.on('stop', handler);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('.reset', () => {
    it('removes all listeners so subsequent emits do not call them', () => {
      const handler = jasmine.createSpy('handler');
      EngineEvents.on('stop', handler);
      EngineEvents.reset();
      EngineEvents.emit('stop');
      expect(handler).not.toHaveBeenCalled();
    });

    it('removes listeners for all event types', () => {
      const stopHandler = jasmine.createSpy('stopHandler');
      const startHandler = jasmine.createSpy('startHandler');
      EngineEvents.on('stop', stopHandler);
      EngineEvents.on('start', startHandler);
      EngineEvents.reset();
      EngineEvents.emit('stop');
      EngineEvents.emit('start');
      expect(stopHandler).not.toHaveBeenCalled();
      expect(startHandler).not.toHaveBeenCalled();
    });
  });
});
