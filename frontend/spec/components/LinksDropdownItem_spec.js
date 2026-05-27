import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LinksDropdownItem from '../../src/components/elements/LinksDropdownItem.jsx';

const render = (props) => renderToStaticMarkup(createElement(LinksDropdownItem, props));

describe('LinksDropdownItem', () => {
  it('renders a list item', () => {
    expect(render({ text: 'Home', url: 'https://example.com' })).toContain('<li');
  });

  it('renders the link text', () => {
    expect(render({ text: 'Home', url: 'https://example.com' })).toContain('Home');
  });

  it('renders the link href', () => {
    expect(render({ text: 'Home', url: 'https://example.com' })).toContain('href="https://example.com"');
  });

  it('opens in a new tab', () => {
    expect(render({ text: 'Home', url: 'https://example.com' })).toContain('target="_blank"');
  });

  it('applies the dropdown-item class', () => {
    expect(render({ text: 'Home', url: 'https://example.com' })).toContain('dropdown-item');
  });

  it('applies rel noreferrer', () => {
    expect(render({ text: 'Home', url: 'https://example.com' })).toContain('rel="noreferrer"');
  });
});
