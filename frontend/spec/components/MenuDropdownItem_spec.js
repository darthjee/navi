import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import MenuDropdownItem from '../../src/components/elements/MenuDropdownItem.jsx';

const render = (props) => renderToStaticMarkup(createElement(MenuDropdownItem, props));

const renderRouted = (props) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, createElement(MenuDropdownItem, props)));

describe('MenuDropdownItem', () => {
  describe('when the route is external', () => {
    const props = { text: 'Docs', route: 'https://example.com/docs' };

    it('renders a list item', () => {
      expect(render(props)).toContain('<li');
    });

    it('renders the entry text', () => {
      expect(render(props)).toContain('Docs');
    });

    it('renders the entry href', () => {
      expect(render(props)).toContain('href="https://example.com/docs"');
    });

    it('opens in a new tab', () => {
      expect(render(props)).toContain('target="_blank"');
    });

    it('applies the dropdown-item class', () => {
      expect(render(props)).toContain('dropdown-item');
    });

    it('applies rel noreferrer', () => {
      expect(render(props)).toContain('rel="noreferrer"');
    });
  });

  describe('when the route is internal', () => {
    const props = { text: 'Logs', route: '/logs' };

    it('renders a list item', () => {
      expect(renderRouted(props)).toContain('<li');
    });

    it('renders the entry text', () => {
      expect(renderRouted(props)).toContain('Logs');
    });

    it('renders a hash-router link href', () => {
      expect(renderRouted(props)).toContain('href="/logs"');
    });

    it('does not open in a new tab', () => {
      expect(renderRouted(props)).not.toContain('target="_blank"');
    });

    it('applies the dropdown-item class', () => {
      expect(renderRouted(props)).toContain('dropdown-item');
    });
  });
});
