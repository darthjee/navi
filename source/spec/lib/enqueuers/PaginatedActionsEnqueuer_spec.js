import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { PaginatedActionsEnqueuer } from '../../../lib/enqueuers/PaginatedActionsEnqueuer.js';
import { NullResponse } from '../../../lib/exceptions/NullResponse.js';
import { PaginatedActionEnqueuerUtils } from '../../support/utils/PaginatedActionEnqueuerUtils.js';

describe('PaginatedActionsEnqueuer', () => {
  const ctx = PaginatedActionEnqueuerUtils.setup();

  let paginatedActions;

  beforeEach(() => {
    paginatedActions = [ctx.paginatedAction];
  });

  describe('#enqueue', () => {
    describe('when the items list is null', () => {
      it('throws NullResponse', () => {
        const enqueuer = new PaginatedActionsEnqueuer(paginatedActions, null);
        expect(() => enqueuer.enqueue()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when there is a single item wrapper', () => {
      const item = { parsedBody: { id: 1, name: 'Electronics' }, headers: {} };

      it('calls enqueue once with the paginatedAction and item', () => {
        new PaginatedActionsEnqueuer(paginatedActions, [item]).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item });
      });
    });

    describe('when there are multiple item wrappers', () => {
      const items = [
        { parsedBody: { id: 1 }, headers: {} },
        { parsedBody: { id: 2 }, headers: {} },
      ];

      it('calls enqueue once per element', () => {
        new PaginatedActionsEnqueuer(paginatedActions, items).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item: items[0] });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item: items[1] });
      });

      describe('with multiple paginated actions', () => {
        let secondPaginatedAction;

        beforeEach(() => {
          secondPaginatedAction = jasmine.createSpyObj('secondPaginatedAction', ['execute']);
          paginatedActions = [ctx.paginatedAction, secondPaginatedAction];
        });

        it('calls enqueue for each paginatedAction × item combination', () => {
          new PaginatedActionsEnqueuer(paginatedActions, items).enqueue();
          expect(JobRegistry.enqueue).toHaveBeenCalledTimes(4);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item: items[0] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, item: items[1] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: secondPaginatedAction, item: items[0] });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: secondPaginatedAction, item: items[1] });
        });
      });
    });
  });
});
