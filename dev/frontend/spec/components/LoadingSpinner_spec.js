import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LoadingSpinner from '../../src/components/LoadingSpinner.jsx';

describe('LoadingSpinner', () => {
  let container;
  let root;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      root = createRoot(container);
      root.render(createElement(LoadingSpinner));
    });
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  it('renders a spinner with role status', () => {
    const spinner = container.querySelector('.spinner-border');
    expect(spinner).not.toBeNull();
    expect(spinner.getAttribute('role')).toBe('status');
  });
});
