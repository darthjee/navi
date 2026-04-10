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
    describe('when the parsed response is null', () => {
      it('throws NullResponse', () => {
        const enqueuer = new ActionsEnqueuer(actions, null);
        expect(() => enqueuer.enqueue()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when the parsed response is a single object', () => {
      const parsed = { id: 1, name: 'Electronics' };

      it('calls enqueue once with the action and item', () => {
        new ActionsEnqueuer(actions, parsed).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('Action', { action, item: parsed });
      });
    });

    describe('when the parsed response is an array', () => {
      const parsed = [{ id: 1 }, { id: 2 }];

      it('calls enqueue once per element', () => {
        new ActionsEnqueuer(actions, parsed).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
      });

      describe('with multiple actions', () => {
        let secondAction;

        beforeEach(() => {
          secondAction = jasmine.createSpyObj('secondAction', ['execute']);
          actions = [action, secondAction];
        });

        it('calls enqueue for each action × item combination', () => {
          new ActionsEnqueuer(actions, parsed).enqueue();
          expect(JobRegistry.enqueue).toHaveBeenCalledTimes(4);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: { id: 1 } });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: secondAction, item: { id: 2 } });
        });
      });
    });
  });
});
