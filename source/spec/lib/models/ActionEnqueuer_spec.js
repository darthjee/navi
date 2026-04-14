import { ActionEnqueuer } from '../../../lib/models/ActionEnqueuer.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { ActionEnqueuerUtils } from '../../support/utils/ActionEnqueuerUtils.js';

describe('ActionEnqueuer', () => {
  const ctx = ActionEnqueuerUtils.setup();

  describe('#enqueue', () => {
    describe('when items is an empty array', () => {
      it('does not call enqueue', () => {
        new ActionEnqueuer(ctx.action, []).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when there is a single item', () => {
      const item = { id: 1, name: 'Electronics' };

      it('calls enqueue once with the Action factory key, action and item', () => {
        new ActionEnqueuer(ctx.action, [item]).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('Action', { action: ctx.action, item });
      });
    });

    describe('when there are multiple items', () => {
      const items = [{ id: 1 }, { id: 2 }];

      it('calls enqueue once per item', () => {
        new ActionEnqueuer(ctx.action, items).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: ctx.action, item: { id: 1 } });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Action', { action: ctx.action, item: { id: 2 } });
      });
    });
  });
});
