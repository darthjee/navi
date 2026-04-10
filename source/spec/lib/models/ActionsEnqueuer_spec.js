import { NullResponse } from '../../../lib/exceptions/NullResponse.js';
import { ActionsEnqueuer } from '../../../lib/models/ActionsEnqueuer.js';

describe('ActionsEnqueuer', () => {
  let action;
  let actions;
  let jobRegistry;

  beforeEach(() => {
    action = jasmine.createSpyObj('action', ['execute']);
    actions = [action];
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
  });

  describe('#enqueue', () => {
    describe('when the parsed response is null', () => {
      it('throws NullResponse', () => {
        const enqueuer = new ActionsEnqueuer(actions, null, jobRegistry);
        expect(() => enqueuer.enqueue()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when the parsed response is a single object', () => {
      const parsed = { id: 1, name: 'Electronics' };

      it('calls enqueue once with the action and item', () => {
        new ActionsEnqueuer(actions, parsed, jobRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('Action', { action, item: parsed });
      });
    });

    describe('when the parsed response is an array', () => {
      const parsed = [{ id: 1 }, { id: 2 }];

      it('calls enqueue once per element', () => {
        new ActionsEnqueuer(actions, parsed, jobRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [action, secondAction];
        });

        it('calls enqueue for each action × item combination', () => {
          new ActionsEnqueuer(actions, parsed, jobRegistry).enqueue();
          expect(jobRegistry.enqueue).toHaveBeenCalledTimes(4);
          expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
          expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
          expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: { id: 1 } });
          expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: { id: 2 } });
        });
      });
    });
  });
});
