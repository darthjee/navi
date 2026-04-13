import { NullResponse } from '../../../lib/exceptions/NullResponse.js';
import { ActionsEnqueuer } from '../../../lib/models/ActionsEnqueuer.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';

describe('ActionsEnqueuer', () => {
  let action;
  let actions;

  beforeEach(() => {
    action = jasmine.createSpyObj('action', ['execute']);
    actions = [action];
    JobRegistry.build({ cooldown: -1 });
    spyOn(JobRegistry, 'enqueue').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
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
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('Action', { action, item });
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
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: items[0] });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: items[1] });
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [action, secondAction];
        });

        it('calls enqueue for each action × item combination', () => {
          new ActionsEnqueuer(actions, items).enqueue();
          expect(JobRegistry.enqueue).toHaveBeenCalledTimes(4);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: items[0] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: items[1] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: items[0] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: items[1] });
        });
      });
    });
  });
});
