import { NullResponse } from '../../../lib/exceptions/NullResponse.js';
import { ActionsEnqueuer } from '../../../lib/enqueuers/ActionsEnqueuer.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { ActionEnqueuerUtils } from '../../support/utils/ActionEnqueuerUtils.js';

describe('ActionsEnqueuer', () => {
  const ctx = ActionEnqueuerUtils.setup();

  let actions;

  beforeEach(() => {
    actions = [ctx.action];
  });

  describe('#enqueue', () => {
    describe('when the items list is null', () => {
      it('throws NullResponse', () => {
        const enqueuer = new ActionsEnqueuer(actions, null);
        expect(() => enqueuer.enqueue()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when there is a single item wrapper', () => {
      const item = { parsedBody: { id: 1, name: 'Electronics' }, headers: {} };

      it('calls enqueue once with the action and item', () => {
        new ActionsEnqueuer(actions, [item]).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('Action', { action: ctx.action, item });
      });
    });

    describe('when there are multiple item wrappers', () => {
      const items = [
        { parsedBody: { id: 1 }, headers: {} },
        { parsedBody: { id: 2 }, headers: {} },
      ];

      it('calls enqueue once per element', () => {
        new ActionsEnqueuer(actions, items).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: ctx.action, item: items[0] });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: ctx.action, item: items[1] });
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [ctx.action, secondAction];
        });

        it('calls enqueue for each action × item combination', () => {
          new ActionsEnqueuer(actions, items).enqueue();
          expect(JobRegistry.enqueue).toHaveBeenCalledTimes(4);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: ctx.action, item: items[0] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: ctx.action, item: items[1] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: items[0] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: items[1] });
        });
      });
    });
  });
});
