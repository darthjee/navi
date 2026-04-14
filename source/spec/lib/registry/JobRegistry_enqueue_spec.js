import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';
import { JobRegistryUtils } from '../../support/utils/JobRegistryUtils.js';

describe('JobRegistry', () => {
  let resourceRequest;

  JobRegistryUtils.setup();

  beforeEach(() => {
    resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
  });

  describe('.enqueue', () => {
    it('creates and enqueues a job', () => {
      expect(JobRegistry.hasJob()).toBeFalse();

      const jobAttributes = { resourceRequest, parameters: { id: 20 } };
      const job = JobRegistry.enqueue('ResourceRequestJob', jobAttributes);

      expect(job).toBeInstanceOf(Job);
      expect(JobRegistry.hasJob()).toBeTrue();
    });

    it('passes params to the factory', () => {
      const factory = JobFactory.get('ResourceRequestJob');
      spyOn(factory, 'build').and.callThrough();

      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });

      expect(factory.build).toHaveBeenCalledWith(
        jasmine.objectContaining({ resourceRequest })
      );
    });

    describe('with a different factory key', () => {
      let action;
      let item;
      let actionFactory;

      beforeEach(() => {
        action = jasmine.createSpyObj('action', ['execute']);
        item = { id: 1 };
        JobFactory.build('Action', {});
        actionFactory = JobFactory.get('Action');
      });

      it('creates and enqueues a job', () => {
        expect(JobRegistry.hasJob()).toBeFalse();
        const job = JobRegistry.enqueue('Action', { action, item });
        expect(job).toBeInstanceOf(Job);
        expect(JobRegistry.hasJob()).toBeTrue();
      });

      it('passes params to the named factory', () => {
        spyOn(actionFactory, 'build').and.callThrough();

        JobRegistry.enqueue('Action', { action, item });

        expect(actionFactory.build).toHaveBeenCalledWith(
          jasmine.objectContaining({ action, item })
        );
      });
    });
  });
});
