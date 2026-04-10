import { NullResponse } from '../../../lib/exceptions/NullResponse.js';
import { ActionsEnqueuer } from '../../../lib/models/ActionsEnqueuer.js';

describe('ActionsEnqueuer', () => {
  let action;
  let actions;
  let jobRegistry;

  beforeEach(() => {
    action = jasmine.createSpyObj('action', ['execute']);
    actions = [action];
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueueAction']);
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

      it('calls enqueueAction once with the action and item', () => {
        new ActionsEnqueuer(actions, parsed, jobRegistry).enqueue();
        expect(jobRegistry.enqueueAction).toHaveBeenCalledOnceWith('Action', { action, item: parsed });
      });
    });

    describe('when the parsed response is an array', () => {
      const parsed = [{ id: 1 }, { id: 2 }];

      it('calls enqueueAction once per element', () => {
        new ActionsEnqueuer(actions, parsed, jobRegistry).enqueue();
        expect(jobRegistry.enqueueAction).toHaveBeenCalledTimes(2);
        expect(jobRegistry.enqueueAction).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
        expect(jobRegistry.enqueueAction).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [action, secondAction];
        });

        it('calls enqueueAction for each action × item combination', () => {
          new ActionsEnqueuer(actions, parsed, jobRegistry).enqueue();
          expect(jobRegistry.enqueueAction).toHaveBeenCalledTimes(4);
          expect(jobRegistry.enqueueAction).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
          expect(jobRegistry.enqueueAction).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
          expect(jobRegistry.enqueueAction).toHaveBeenCalledWith('Action', { action: secondAction, item: { id: 1 } });
          expect(jobRegistry.enqueueAction).toHaveBeenCalledWith('Action', { action: secondAction, item: { id: 2 } });
        });
      });
    });
  });
});
