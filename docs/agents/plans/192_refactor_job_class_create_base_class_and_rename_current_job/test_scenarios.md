# Test Scenarios

## `source/spec/models/Job_spec.js` (updated — base class contract)

The spec now covers only the base class responsibilities. The `perform()` HTTP scenarios move to `ResourceRequestJob_spec.js`. Use `_fail` directly to drive `exhausted` and `lastError` tests — no HTTP mocking needed.

```javascript
import { Job } from '../../lib/models/Job.js';

describe('Job', () => {
  let job;

  beforeEach(() => {
    job = new Job({ id: 'test-id' });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('test-id');
    });
  });

  describe('#perform', () => {
    it('throws when not overridden', async () => {
      await expectAsync(job.perform()).toBeRejectedWithError(
        'You must implement the perform method in a subclass'
      );
    });
  });

  describe('#isReadyBy', () => {
    describe('when no cooldown was applied (default)', () => {
      it('returns true', () => {
        expect(job.isReadyBy(Date.now())).toBeTrue();
      });
    });

    describe('when cooldown is in the past', () => {
      beforeEach(() => { job.applyCooldown(-1000); });

      it('returns true', () => {
        expect(job.isReadyBy(Date.now())).toBeTrue();
      });
    });

    describe('when cooldown is in the future', () => {
      beforeEach(() => { job.applyCooldown(10_000); });

      it('returns false', () => {
        expect(job.isReadyBy(Date.now())).toBeFalse();
      });
    });
  });

  describe('#exhausted', () => {
    const error = new Error('test error');

    it('returns false with zero attempts', () => {
      expect(job.exhausted()).toBeFalse();
    });

    it('returns false with fewer than 3 attempts', () => {
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      expect(job.exhausted()).toBeFalse();
    });

    it('returns true after 3 attempts', () => {
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      expect(job.exhausted()).toBeTrue();
    });

    it('remains true beyond 3 attempts', () => {
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      try { job._fail(error); } catch (_) {}
      expect(job.exhausted()).toBeTrue();
    });
  });

  describe('#_fail', () => {
    const error = new Error('test error');

    it('sets lastError', () => {
      expect(job.lastError).toBeUndefined();
      try { job._fail(error); } catch (_) {}
      expect(job.lastError).toEqual(error);
    });

    it('rethrows the error', () => {
      expect(() => job._fail(error)).toThrow(error);
    });
  });
});
```

---

## `source/spec/models/ResourceRequestJob_spec.js` (new file)

Covers `perform()` behaviour with a live `ClientRegistry` + mocked Axios — mirrors the current `Job_spec.js` `#process` scenarios, updated to use `ResourceRequestJob`.

```javascript
import axios from 'axios';
import { RequestFailed } from '../../lib/exceptions/RequestFailed.js';
import { ResourceRequestJob } from '../../lib/models/ResourceRequestJob.js';
import { Logger } from '../../lib/utils/Logger.js';
import { ClientFactory } from '../support/factories/ClientFactory.js';
import { ClientRegistryFactory } from '../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';

describe('ResourceRequestJob', () => {
  let resourceRequest;
  let clients;
  let client;
  let parameters;
  let job;

  const baseUrl = 'http://example.com';
  const url = '/categories.json';
  const fullUrl = 'http://example.com/categories.json';
  const status = 200;

  let response;
  let expectedError;

  beforeEach(() => {
    resourceRequest = ResourceRequestFactory.build({ url, status });
    client = ClientFactory.build({ baseUrl });
    clients = ClientRegistryFactory.build({ default: client });
    parameters = {};

    job = new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters });
  });

  describe('#constructor', () => {
    it('stores the id', () => {
      expect(job.id).toEqual('id');
    });
  });

  describe('#perform', () => {
    describe('when the client request is successful', () => {
      beforeEach(() => {
        response = { status: 200, data: '[]' };
        spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
        spyOn(Logger, 'info').and.stub();
        spyOn(resourceRequest, 'executeActions').and.stub();
      });

      it('resolves with the response', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(axios.get).toHaveBeenCalledWith(fullUrl, { timeout: 5000, responseType: 'text' });
      });

      it('calls executeActions with the response data', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(resourceRequest.executeActions).toHaveBeenCalledOnceWith(response.data);
      });

      it('logs info when performing', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(Logger.info).toHaveBeenCalledWith(`Job #${job.id} performing`);
      });

      it('does not exhaust after several successful attempts', async () => {
        await expectAsync(job.perform()).toBeResolvedTo(response);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        await expectAsync(job.perform()).toBeResolvedTo(response);
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toBeUndefined();
      });
    });

    describe('when the client request fails', () => {
      beforeEach(() => {
        response = { status: 502, data: '[]' };
        expectedError = new RequestFailed(502, fullUrl);
        spyOn(axios, 'get').and.returnValue(Promise.resolve(response));
        spyOn(Logger, 'error').and.stub();
        spyOn(Logger, 'info').and.stub();
        spyOn(resourceRequest, 'executeActions').and.stub();
      });

      it('does not call executeActions', async () => {
        await job.perform().catch(() => {});
        expect(resourceRequest.executeActions).not.toHaveBeenCalled();
      });

      it('registers failure and increments attempts', async () => {
        expect(job.lastError).toBeUndefined();
        await job.perform().catch(() => {});
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeFalse();
        expect(job.lastError).toEqual(expectedError);
        await job.perform().catch(() => {});
        expect(job.exhausted()).toBeTrue();
        expect(job.lastError).toEqual(expectedError);
      });

      it('logs the error', async () => {
        await job.perform().catch(() => {});
        expect(Logger.error).toHaveBeenCalledWith(`Job #${job.id} failed: ${expectedError}`);
      });
    });
  });
});
```

---

## `source/spec/factories/JobFactory_spec.js` (updated)

Pass `attributes: { clients }` at construction; assert the result is a `ResourceRequestJob`.

```javascript
import { JobFactory } from '../../lib/factories/JobFactory.js';
import { ResourceRequestJob } from '../../lib/models/ResourceRequestJob.js';
import { ClientRegistryFactory } from '../support/factories/ClientRegistryFactory.js';
import { ResourceRequestFactory } from '../support/factories/ResourceRequestFactory.js';

describe('JobFactory', () => {
  describe('#build', () => {
    let factory;
    let resourceRequest;
    let parameters;
    let clients;

    beforeEach(() => {
      clients = ClientRegistryFactory.build({});
      factory = new JobFactory({ attributes: { clients } });
      resourceRequest = ResourceRequestFactory.build({ url: '/test' });
      parameters = {};
    });

    it('builds an instance of ResourceRequestJob', () => {
      const job = factory.build({ resourceRequest, parameters });
      expect(job).toBeInstanceOf(ResourceRequestJob);
    });
  });
});
```

---

## `source/spec/support/dummies/models/DummyJob.js` (no change needed)

`DummyJob` already extends `Job` and implements `perform()` — it remains valid as-is after the refactor since `Job` keeps its name and role as the base class.
