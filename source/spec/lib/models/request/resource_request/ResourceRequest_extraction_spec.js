import { JobRegistry } from 'deku-swarm';
import { ResourceRequest } from '../../../../../lib/models/request/resource_request/ResourceRequest.js';
import { Application } from '../../../../../lib/services/application/Application.js';
import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';
import { LoggerUtils } from '../../../../support/utils/LoggerUtils.js';
import { ResourceRequestSpecUtils } from '../../../../support/utils/ResourceRequestSpecUtils.js';

describe('ResourceRequest', () => {
  describe('#enqueueExtraction', () => {
    let request;
    let jobRegistry;

    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueue']);
      request = new ResourceRequest({
        url: '/',
        status: 200,
        parser: { type: 'regex', match: '\\d+', field: 'value' },
      });
    });

    it('enqueues one Extraction job with the rawBody and parser', () => {
      const rawBody = 'value: 42';
      request.enqueueExtraction(rawBody, jobRegistry);

      expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('Extraction', jasmine.objectContaining({
        rawBody,
        parser: request.parser,
      }));
    });

    it('includes the given parameters', () => {
      const parameters = { id: '42' };
      request.enqueueExtraction('value: 42', jobRegistry, parameters);

      expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('Extraction', jasmine.objectContaining({
        parameters,
      }));
    });

    it('includes originUrl when given', () => {
      const originUrl = 'https://example.com/page.json';
      request.enqueueExtraction('value: 42', jobRegistry, {}, originUrl);

      expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('Extraction', jasmine.objectContaining({
        originUrl,
      }));
    });

    it('does not include originUrl when not given', () => {
      request.enqueueExtraction('value: 42', jobRegistry);

      const [, params] = jobRegistry.enqueue.calls.mostRecent().args;
      expect(params.originUrl).toBeUndefined();
    });

    it('does not enqueue jobs when the application is stopped', () => {
      spyOn(Application, 'isStopped').and.returnValue(true);
      request.enqueueExtraction('value: 42', jobRegistry);
      expect(jobRegistry.enqueue).not.toHaveBeenCalled();
    });

    describe('when an emit is configured', () => {
      beforeEach(() => {
        request = new ResourceRequest({
          url: '/',
          status: 200,
          parser: { type: 'regex', match: '\\d+', field: 'value' },
          emit: { method: 'POST', url: 'https://example.com/items' },
        });
      });

      it('includes the emit configuration', () => {
        request.enqueueExtraction('value: 42', jobRegistry);

        expect(jobRegistry.enqueue).toHaveBeenCalledOnceWith('Extraction', jasmine.objectContaining({
          emit: request.emit,
        }));
      });
    });

    describe('when no emit is configured', () => {
      it('does not include an emit key', () => {
        request.enqueueExtraction('value: 42', jobRegistry);

        const [, params] = jobRegistry.enqueue.calls.mostRecent().args;
        expect(params.emit).toBeUndefined();
      });
    });
  });

  describe('#enqueuePaginatedActions', () => {
    ResourceRequestSpecUtils.setupJobRegistrySpy();

    let paginatedAction;
    let request;

    beforeEach(() => {
      paginatedAction = jasmine.createSpyObj('paginatedAction', ['execute']);
      request = ResourceRequestFactory.build();
      request.paginatedActions = [paginatedAction];
    });

    it('does not enqueue anything when there are no paginated actions', () => {
      request.paginatedActions = [];
      request.enqueuePaginatedActions(ResourceRequestSpecUtils.buildResponseWrapper('[]'));
      expect(JobRegistry.enqueue).not.toHaveBeenCalled();
    });

    it('calls enqueue once per paginated action', () => {
      request.enqueuePaginatedActions(ResourceRequestSpecUtils.buildResponseWrapper('[{"id":1},{"id":2}]'));
      expect(JobRegistry.enqueue).toHaveBeenCalledTimes(1);
    });

    it('enqueues the paginated action with wrapper and parameters', () => {
      const wrapper = ResourceRequestSpecUtils.buildResponseWrapper('{"id":1}');
      const parameters = { category_id: 5 };
      request.enqueuePaginatedActions(wrapper, parameters);
      expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith(
        'PaginatedAction',
        jasmine.objectContaining({ paginatedAction, responseWrapper: wrapper, parameters }),
      );
    });
  });
});
