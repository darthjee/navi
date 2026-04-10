import { ActionEnqueuer } from '../../../lib/models/ActionEnqueuer.js';

describe('ActionEnqueuer', () => {
  let action;
  let jobRegistry;

  beforeEach(() => {
    action = jasmine.createSpyObj('action', ['execute']);
    jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
  });

  describe('#enqueue', () => {
    describe('when items is an empty array', () => {
      it('does not call enqueue', () => {
        new ActionEnqueuer(action, [], jobRegistry).enqueue();
        expect(jobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when there is a single item', () => {
      const item = { id: 1, name: 'Electronics' };

      it('calls enqueue once with the Action factory key, action and item', () => {
        new ActionEnqueuer(action, [item], jobRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('Action', { action, item });
      });
    });

    describe('when there are multiple items', () => {
      const items = [{ id: 1 }, { id: 2 }];

      it('calls enqueue once per item', () => {
        new ActionEnqueuer(action, items, jobRegistry).enqueue();
        expect(jobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 1 } });
        expect(jobRegistry.enqueue).toHaveBeenCalledWith('Action', { action, item: { id: 2 } });
      });
    });
  });
});
