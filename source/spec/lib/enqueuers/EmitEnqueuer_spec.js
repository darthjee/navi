import { JobRegistry } from 'deku-swarm';
import { EmitEnqueuer } from '../../../lib/enqueuers/EmitEnqueuer.js';
import { Application } from '../../../lib/services/application/Application.js';

describe('EmitEnqueuer', () => {
  const emit = { url: 'https://example.com/items/{:id}', method: 'POST' };
  const parameters = { id: 42 };

  beforeEach(() => {
    JobRegistry.build({ cooldown: -1 });
    spyOn(JobRegistry, 'enqueue').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
  });

  describe('#enqueue', () => {
    describe('when items is an empty array', () => {
      it('does not call enqueue', () => {
        new EmitEnqueuer([], emit, parameters).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });

    describe('when there is a single item', () => {
      const item = { id: 1, name: 'Widget' };

      it('calls enqueue once with the Emit factory key, item, emit and parameters', () => {
        new EmitEnqueuer([item], emit, parameters).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledOnceWith('Emit', { item, emit, parameters });
      });
    });

    describe('when there are multiple items', () => {
      const items = [{ id: 1 }, { id: 2 }];

      it('calls enqueue once per item, forwarding the same emit and parameters', () => {
        new EmitEnqueuer(items, emit, parameters).enqueue();
        expect(JobRegistry.enqueue).toHaveBeenCalledTimes(2);
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Emit', { item: { id: 1 }, emit, parameters });
        expect(JobRegistry.enqueue).toHaveBeenCalledWith('Emit', { item: { id: 2 }, emit, parameters });
      });
    });

    describe('when the application is stopped', () => {
      beforeEach(() => {
        spyOn(Application, 'isStopped').and.returnValue(true);
      });

      it('does not call enqueue', () => {
        new EmitEnqueuer([{ id: 1 }], emit, parameters).enqueue();
        expect(JobRegistry.enqueue).not.toHaveBeenCalled();
      });
    });
  });
});
