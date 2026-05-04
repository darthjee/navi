import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import StatItem from '../../src/components/elements/StatItem.jsx';

const render = (props) => renderToStaticMarkup(
  createElement(MemoryRouter, null, createElement(StatItem, props))
);

describe('StatItem', () => {
  describe('rendering', () => {
    it('displays the value', () => {
      const html = render({ label: 'Idle', value: 5, variant: 'success' });
      expect(html).toContain('5');
    });

    it('displays the label', () => {
      const html = render({ label: 'Idle', value: 5, variant: 'success' });
      expect(html).toContain('Idle');
    });

    it('applies the variant CSS class to the card', () => {
      const html = render({ label: 'Idle', value: 5, variant: 'success' });
      expect(html).toContain('text-bg-success');
    });

    it('renders the value with bold styling', () => {
      const html = render({ label: 'Total', value: 42, variant: 'primary' });
      expect(html).toContain('class="fs-5 fw-bold"');
      expect(html).toContain('42');
    });

    it('renders the label with uppercase styling', () => {
      const html = render({ label: 'Busy', value: 2, variant: 'warning' });
      expect(html).toContain('class="text-uppercase small"');
      expect(html).toContain('Busy');
    });
  });

  describe('with different variants', () => {
    it('applies the danger variant', () => {
      const html = render({ label: 'Failed', value: 0, variant: 'danger' });
      expect(html).toContain('text-bg-danger');
    });

    it('applies the dark variant', () => {
      const html = render({ label: 'Dead', value: 0, variant: 'dark' });
      expect(html).toContain('text-bg-dark');
    });

    it('applies the secondary variant', () => {
      const html = render({ label: 'Enqueued', value: 3, variant: 'secondary' });
      expect(html).toContain('text-bg-secondary');
    });
  });

  describe('with a to prop', () => {
    it('wraps the card in an anchor link', () => {
      const html = render({ label: 'Enqueued', value: 3, variant: 'secondary', to: '/jobs/enqueued' });
      expect(html).toContain('<a ');
      expect(html).toContain('href="/jobs/enqueued"');
    });

    it('renders the card content inside the link', () => {
      const html = render({ label: 'Enqueued', value: 3, variant: 'secondary', to: '/jobs/enqueued' });
      expect(html).toContain('text-bg-secondary');
      expect(html).toContain('Enqueued');
      expect(html).toContain('3');
    });
  });

  describe('without a to prop', () => {
    it('does not render an anchor link', () => {
      const html = render({ label: 'Idle', value: 5, variant: 'success' });
      expect(html).not.toContain('<a ');
    });
  });
});
