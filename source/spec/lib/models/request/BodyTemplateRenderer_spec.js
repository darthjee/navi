import { BodyTemplateRenderer } from '../../../../lib/models/request/BodyTemplateRenderer.js';

describe('BodyTemplateRenderer', () => {
  describe('.render', () => {
    describe('when the template has nested arrays and objects', () => {
      it('recursively renders every string leaf', () => {
        const template = {
          id: '{:id}',
          items: [{ name: '{:name}' }, { note: 'fixed {:id}' }],
        };
        const item = { id: 1, name: 'Widget' };

        expect(BodyTemplateRenderer.render(template, item)).toEqual({
          id: 1,
          items: [{ name: 'Widget' }, { note: 'fixed 1' }],
        });
      });
    });

    describe('when the template is an array at the top level', () => {
      it('renders each element', () => {
        const template = ['{:id}', '{:name}'];
        const item = { id: 1, name: 'Widget' };

        expect(BodyTemplateRenderer.render(template, item)).toEqual([1, 'Widget']);
      });
    });

    describe('when a template node is a non-plain object (e.g. a Date instance)', () => {
      it('flattens it to {} via the plain-object branch, without special-casing it', () => {
        const template = { createdAt: new Date() };

        expect(BodyTemplateRenderer.render(template, {})).toEqual({ createdAt: {} });
      });
    });

    describe('when the template has scalar leaf values', () => {
      it('passes numbers, booleans, and null through unchanged', () => {
        const template = { count: 5, active: true, missing: null };

        expect(BodyTemplateRenderer.render(template, {})).toEqual({ count: 5, active: true, missing: null });
      });
    });

    describe('when a template node is a string', () => {
      it('delegates rendering to TemplateStringRenderer', () => {
        const template = { name: 'Hello {:name}!' };
        const item = { name: 'World' };

        expect(BodyTemplateRenderer.render(template, item)).toEqual({ name: 'Hello World!' });
      });
    });
  });
});
