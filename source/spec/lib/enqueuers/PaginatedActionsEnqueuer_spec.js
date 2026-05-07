import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { PaginatedActionsEnqueuer } from '../../../lib/enqueuers/PaginatedActionsEnqueuer.js';
import { NullResponse } from '../../../lib/exceptions/request/NullResponse.js';
import { PaginatedActionEnqueuerUtils } from '../../support/utils/PaginatedActionEnqueuerUtils.js';

describe('PaginatedActionsEnqueuer', () => {
  const ctx = PaginatedActionEnqueuerUtils.setup();

  let paginatedActions;

  beforeEach(() => {
    paginatedActions = [ctx.paginatedAction];
  });

  describe('#enqueue', () => {
    describe('when the parameters are null', () => {
      it('throws NullResponse', () => {
        const enqueuer = new PaginatedActionsEnqueuer(paginatedActions, null);
        expect(() => enqueuer.enqueue()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when parameters are provided', () => {
      const parameters = { parsedBody: { id: 1 }, headers: {}, parameters: {} };

      it('calls enqueue once with the paginatedAction and parameters', () => {
        new PaginatedActionsEnqueuer(paginatedActions, parameters).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, parameters });
      });

      describe('with multiple paginated actions', () => {
        let secondPaginatedAction;

        beforeEach(() => {
          secondPaginatedAction = jasmine.createSpyObj('secondPaginatedAction', ['execute']);
          paginatedActions = [ctx.paginatedAction, secondPaginatedAction];
        });

        it('calls enqueue once per paginated action', () => {
          new PaginatedActionsEnqueuer(paginatedActions, parameters).enqueue();
          expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, parameters });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: secondPaginatedAction, parameters });
        });
      });
    });

    describe('when originUrl is provided', () => {
      const parameters = { parsedBody: { id: 1 }, headers: {}, parameters: {} };
      const originUrl = 'https://example.com/items.json';

      it('includes originUrl in each enqueued job', () => {
        new PaginatedActionsEnqueuer(paginatedActions, parameters, undefined, originUrl).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', {
          paginatedAction: ctx.paginatedAction,
          parameters,
          originUrl,
        });
      });
    });
  });
});
