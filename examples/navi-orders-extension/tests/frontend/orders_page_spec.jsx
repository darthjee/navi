import { act } from 'react';
import { useContainer } from 'navi-hey/testing/dom.js';
import { mockFetchSuccess } from 'navi-hey/testing/fetch.js';
import descriptors from '../../src/frontend/entry.js';

describe('OrdersPage', () => {
  const state = useContainer();
  mockFetchSuccess({ pending: 3, service: 'orders-extension' });

  it('exposes the /ext/orders descriptor', () => {
    expect(descriptors[0].path).toBe('/ext/orders');
    expect(descriptors[0].text).toBe('Orders');
  });

  it('renders the pending-order count', async () => {
    const OrdersPage = descriptors[0].component;

    await act(async () => {
      state.root.render(<OrdersPage />);
    });

    expect(state.container.textContent).toContain('3 pending order(s)');
  });
});
