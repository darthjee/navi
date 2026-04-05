import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StatItem from '../../src/components/StatItem.jsx';

const render = (props) => renderToStaticMarkup(createElement(StatItem, props));

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

    it('wraps the content in a col container', () => {
      const html = render({ label: 'Idle', value: 5, variant: 'success' });
      expect(html).toMatch(/^<div class="col">/);
    });

    it('renders the value with large bold styling', () => {
      const html = render({ label: 'Total', value: 42, variant: 'primary' });
      expect(html).toContain('class="fs-2 fw-bold"');
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
});
