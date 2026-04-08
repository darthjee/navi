import { NullResponse } from '../../../lib/exceptions/NullResponse.js';
import { ActionsExecutor } from '../../../lib/models/ActionsExecutor.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('ActionsExecutor', () => {
  let action;
  let actions;

  beforeEach(() => {
    action = jasmine.createSpyObj('action', ['execute']);
    actions = [action];
    spyOn(Logger, 'error').and.stub();
  });

  describe('#execute', () => {
    describe('when the parsed response is null', () => {
      it('throws NullResponse', () => {
        const executor = new ActionsExecutor(actions, null);
        expect(() => executor.execute()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when the parsed response is a single object', () => {
      const parsed = { id: 1, name: 'Electronics' };

      it('calls execute on the action once with the item', () => {
        new ActionsExecutor(actions, parsed).execute();
        expect(action.execute).toHaveBeenCalledOnceWith(parsed);
      });
    });

    describe('when the parsed response is an array', () => {
      const parsed = [{ id: 1 }, { id: 2 }];

      it('calls execute on the action once per element', () => {
        new ActionsExecutor(actions, parsed).execute();
        expect(action.execute).toHaveBeenCalledTimes(2);
        expect(action.execute).toHaveBeenCalledWith({ id: 1 });
        expect(action.execute).toHaveBeenCalledWith({ id: 2 });
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [action, secondAction];
        });

        it('calls each action for each element', () => {
          new ActionsExecutor(actions, parsed).execute();
          expect(action.execute).toHaveBeenCalledTimes(2);
          expect(secondAction.execute).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('when an action throws', () => {
      const parsed = [{ id: 1 }, { id: 2 }];
      let secondAction;

      beforeEach(() => {
        secondAction = jasmine.createSpyObj('secondAction', ['execute']);
        actions = [action, secondAction];
        action.execute.and.throwError('mapping error');
      });

      it('logs the error', () => {
        new ActionsExecutor(actions, parsed).execute();
        expect(Logger.error).toHaveBeenCalled();
      });

      it('continues executing remaining actions', () => {
        new ActionsExecutor(actions, parsed).execute();
        expect(secondAction.execute).toHaveBeenCalledTimes(2);
      });
    });
  });
});
