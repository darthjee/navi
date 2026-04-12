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
    describe('when the items list is null', () => {
      it('throws NullResponse', () => {
        const executor = new ActionsExecutor(actions, null);
        expect(() => executor.execute()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when there is a single item wrapper', () => {
      const item = { parsed_body: { id: 1, name: 'Electronics' }, headers: {} };

      it('calls execute on the action once with the item', () => {
        new ActionsExecutor(actions, [item]).execute();
        expect(action.execute).toHaveBeenCalledOnceWith(item);
      });
    });

    describe('when there are multiple item wrappers', () => {
      const items = [
        { parsed_body: { id: 1 }, headers: {} },
        { parsed_body: { id: 2 }, headers: {} },
      ];

      it('calls execute on the action once per element', () => {
        new ActionsExecutor(actions, items).execute();
        expect(action.execute).toHaveBeenCalledTimes(2);
        expect(action.execute).toHaveBeenCalledWith(items[0]);
        expect(action.execute).toHaveBeenCalledWith(items[1]);
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [action, secondAction];
        });

        it('calls each action for each element', () => {
          new ActionsExecutor(actions, items).execute();
          expect(action.execute).toHaveBeenCalledTimes(2);
          expect(secondAction.execute).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('when an action throws', () => {
      const items = [
        { parsed_body: { id: 1 }, headers: {} },
        { parsed_body: { id: 2 }, headers: {} },
      ];
      let secondAction;

      beforeEach(() => {
        secondAction = jasmine.createSpyObj('secondAction', ['execute']);
        actions = [action, secondAction];
        action.execute.and.throwError('mapping error');
      });

      it('logs the error', () => {
        new ActionsExecutor(actions, items).execute();
        expect(Logger.error).toHaveBeenCalled();
      });

      it('continues executing remaining actions', () => {
        new ActionsExecutor(actions, items).execute();
        expect(secondAction.execute).toHaveBeenCalledTimes(2);
      });
    });
  });
});
