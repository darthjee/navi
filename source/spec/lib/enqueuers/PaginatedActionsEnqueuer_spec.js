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
    describe('when the responseWrapper is null', () => {
      it('throws NullResponse', () => {
        const enqueuer = new PaginatedActionsEnqueuer(paginatedActions, null);
        expect(() => enqueuer.enqueue()).toThrowMatching(
          (error) => error instanceof NullResponse
        );
      });
    });

    describe('when responseWrapper and parameters are provided', () => {
      const responseWrapper = { parsedBody: { id: 1 }, headers: {} };
      const parameters = { category_id: 5 };

      it('calls enqueue once with the paginatedAction, responseWrapper and parameters', () => {
        new PaginatedActionsEnqueuer(paginatedActions, responseWrapper, parameters).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, responseWrapper, parameters });
      });

      describe('with multiple paginated actions', () => {
        let secondPaginatedAction;

        beforeEach(() => {
          secondPaginatedAction = jasmine.createSpyObj('secondPaginatedAction', ['execute']);
          paginatedActions = [ctx.paginatedAction, secondPaginatedAction];
        });

        it('calls enqueue once per paginated action', () => {
          new PaginatedActionsEnqueuer(paginatedActions, responseWrapper, parameters).enqueue();
          expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: ctx.paginatedAction, responseWrapper, parameters });
          expect(JobRegistry.enqueue).toHaveBeenCalledWith('PaginatedAction', { paginatedAction: secondPaginatedAction, responseWrapper, parameters });
        });
      });
    });

    describe('when originUrl is provided', () => {
      const responseWrapper = { parsedBody: { id: 1 }, headers: {} };
      const parameters = { category_id: 5 };
      const originUrl = 'https://example.com/items.json';

      it('includes originUrl in each enqueued job', () => {
        new PaginatedActionsEnqueuer(paginatedActions, responseWrapper, parameters, undefined, originUrl).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('PaginatedAction', {
          paginatedAction: ctx.paginatedAction,
          responseWrapper,
          parameters,
          originUrl,
        });
      });
    });
  });
});
