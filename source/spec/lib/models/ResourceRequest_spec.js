import { ResourceRequest } from '../../../lib/models/ResourceRequest.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { ResourceRequestActionFactory } from '../../support/factories/ResourceRequestActionFactory.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('ResourceRequest', () => {
  describe('.fromList', () => {
    it('returns a list of ResourceRequest instances with mapped attributes', () => {
      const resources = [
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ];

      const resourceRequests = ResourceRequest.fromList(resources);

      expect(resourceRequests).toEqual([
        ResourceRequestFactory.build(),
        ResourceRequestFactory.build({ url: '/categories.html', status: 302 }),
      ]);
      expect(resourceRequests.every((resourceRequest) => resourceRequest instanceof ResourceRequest)).toBeTrue();
    });

    it('assigns the given clientName to each ResourceRequest', () => {
      const resources = [
        { url: '/categories.json', status: 200 },
        { url: '/categories.html', status: 302 },
      ];

      const resourceRequests = ResourceRequest.fromList(resources, { clientName: 'myClient' });

      expect(resourceRequests.every((rr) => rr.clientName === 'myClient')).toBeTrue();
    });

    it('passes actions through to each ResourceRequest', () => {
      const resources = [
        { url: '/categories.json', status: 200, actions: [{ resource: 'products' }] },
      ];

      const resourceRequests = ResourceRequest.fromList(resources);

      expect(resourceRequests[0].actions.length).toBe(1);
    });
  });

  describe('#clientName', () => {
    it('returns undefined when no clientName is set', () => {
      const request = ResourceRequestFactory.build();
      expect(request.clientName).toBeUndefined();
    });

    it('returns the clientName when set', () => {
      const request = ResourceRequestFactory.build({ clientName: 'myClient' });
      expect(request.clientName).toBe('myClient');
    });
  });

  describe('#needsParams', () => {
    it('returns false when the URL has no placeholders', () => {
      const request = ResourceRequestFactory.build();
      expect(request.needsParams()).toBeFalse();
    });

    it('returns true when the URL has one placeholder', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}.json' });
      expect(request.needsParams()).toBeTrue();
    });

    it('returns true when the URL has multiple placeholders', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{:id}/items/{:item_id}' });
      expect(request.needsParams()).toBeTrue();
    });

    it('returns false for an empty URL', () => {
      const request = ResourceRequestFactory.build({ url: '' });
      expect(request.needsParams()).toBeFalse();
    });

    it('returns false for a malformed placeholder without the colon prefix', () => {
      const request = ResourceRequestFactory.build({ url: '/categories/{id}.json' });
      expect(request.needsParams()).toBeFalse();
    });
  });

  describe('#enqueueActions', () => {
    let action;
    let request;
    let jobRegistry;

    beforeEach(() => {
      spyOn(Logger, 'info').and.stub();
      spyOn(Logger, 'error').and.stub();
      action = ResourceRequestActionFactory.build({ resource: 'products' });
      jobRegistry = jasmine.createSpyObj('jobRegistry', ['enqueueAction']);
    });

    describe('when there are no actions', () => {
      it('returns immediately without parsing', () => {
        request = ResourceRequestFactory.build();
        expect(() => request.enqueueActions('not valid json', jobRegistry)).not.toThrow();
      });

      it('does not call enqueueAction', () => {
        request = ResourceRequestFactory.build();
        request.enqueueActions('[]', jobRegistry);
        expect(jobRegistry.enqueueAction).not.toHaveBeenCalled();
      });
    });

    describe('when the response is a JSON array', () => {
      beforeEach(() => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
        request.actions = [action];
      });

      it('calls enqueueAction once per element', () => {
        request.enqueueActions('[{"id":1},{"id":2}]', jobRegistry);
        expect(jobRegistry.enqueueAction).toHaveBeenCalledTimes(2);
        expect(jobRegistry.enqueueAction).toHaveBeenCalledWith({ action, item: { id: 1 } });
        expect(jobRegistry.enqueueAction).toHaveBeenCalledWith({ action, item: { id: 2 } });
      });
    });

    describe('when the response is a JSON object', () => {
      beforeEach(() => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
        request.actions = [action];
      });

      it('calls enqueueAction once with the item', () => {
        request.enqueueActions('{"id":1}', jobRegistry);
        expect(jobRegistry.enqueueAction).toHaveBeenCalledOnceWith({ action, item: { id: 1 } });
      });
    });
  });

  describe('#executeActions', () => {
    let action;
    let request;

    beforeEach(() => {
      spyOn(Logger, 'info').and.stub();
      spyOn(Logger, 'error').and.stub();
      action = ResourceRequestActionFactory.build({ resource: 'products' });
    });

    describe('when there are no actions', () => {
      it('returns immediately without parsing', () => {
        request = ResourceRequestFactory.build();
        expect(() => request.executeActions('not valid json')).not.toThrow();
      });
    });

    describe('when the response is a JSON array', () => {
      beforeEach(() => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
      });

      it('executes each action once per element', () => {
        spyOn(action, 'execute');
        request.actions = [action];
        request.executeActions('[{"id":1},{"id":2}]');
        expect(action.execute).toHaveBeenCalledTimes(2);
      });
    });

    describe('when the response is a JSON object', () => {
      beforeEach(() => {
        request = ResourceRequestFactory.build({ actions: [{ resource: 'products' }] });
      });

      it('executes each action once', () => {
        spyOn(action, 'execute');
        request.actions = [action];
        request.executeActions('{"id":1}');
        expect(action.execute).toHaveBeenCalledOnceWith({ id: 1 });
      });
    });
  });
});
