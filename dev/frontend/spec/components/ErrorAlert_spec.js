import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorAlert from '../../src/components/ErrorAlert.jsx';

describe('ErrorAlert', () => {
  let container;
  let root;

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    await act(async () => {
      root = createRoot(container);
      root.render(createElement(ErrorAlert, { message: 'Something went wrong' }));
    });
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  it('renders a danger alert containing the message', () => {
    const alert = container.querySelector('.alert-danger');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toBe('Something went wrong');
  });
});
