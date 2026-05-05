import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { PaginatedActionEnqueuer } from '../../../lib/enqueuers/PaginatedActionEnqueuer.js';
import { Application } from '../../../lib/services/Application.js';
import { PaginatedActionEnqueuerUtils } from '../../support/utils/PaginatedActionEnqueuerUtils.js';

describe('PaginatedActionEnqueuer', () => {
  const ctx = PaginatedActionEnqueuerUtils.setup();

  describe('#enqueue', () => {
    describe('when items is an empty array', () => {
      it('does not call enqueue', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, []).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when there is a single item', () => {
      const item = { parsedBody: { id: 1 }, headers: {} };

      it('calls enqueue once with the PaginatedAction factory key, paginatedAction and item', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, [item]).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item });
      });
    });

    describe('when there are multiple items', () => {
      const items = [{ parsedBody: { id: 1 }, headers: {} }, { parsedBody: { id: 2 }, headers: {} }];

      it('calls enqueue once per item', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, items).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item: items[0] });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item: items[1] });
      });
    });

    describe('when the application is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
      });

      it('does not call enqueue', () => {
        new PaginatedActionEnqueuer(ctx.paginatedAction, [{ parsedBody: { id: 1 }, headers: {} }]).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });
  });
});
