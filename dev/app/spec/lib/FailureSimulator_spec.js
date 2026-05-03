import FailureSimulator from '../../lib/FailureSimulator.js';

describe('FailureSimulator', () => {
  let jsonSpy;
  let res;
  let next;

  beforeEach(() => {
    jsonSpy = jasmine.createSpy('json');
    res = { status: jasmine.createSpy('status').and.returnValue({ json: jsonSpy }) };
    next = jasmine.createSpy('next');
  });

  describe('#handle — failureRate = 0', () => {
    const simulator = new FailureSimulator(0);

    it('calls next', () => {
      simulator.handle({}, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('does not respond', () => {
      simulator.handle({}, res, next);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('#handle — failureRate = 1', () => {
    const simulator = new FailureSimulator(1);

    it('responds with 502', () => {
      simulator.handle({}, res, next);
      expect(res.status).toHaveBeenCalledWith(502);
    });

    it('responds with simulated failure body', () => {
      simulator.handle({}, res, next);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Simulated failure' });
    });

    it('does not call next', () => {
      simulator.handle({}, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('#handle — failureRate = 0.5', () => {
    const simulator = new FailureSimulator(0.5);

    describe('when Math.random returns below the rate', () => {
      beforeEach(() => {
        spyOn(Math, 'random').and.returnValue(0.3);
      });

      it('responds with 502', () => {
        simulator.handle({}, res, next);
        expect(res.status).toHaveBeenCalledWith(502);
      });

      it('does not call next', () => {
        simulator.handle({}, res, next);
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('when Math.random returns above the rate', () => {
      beforeEach(() => {
        spyOn(Math, 'random').and.returnValue(0.7);
      });

      it('calls next', () => {
        simulator.handle({}, res, next);
        expect(next).toHaveBeenCalled();
      });

      it('does not respond', () => {
        simulator.handle({}, res, next);
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });
});
