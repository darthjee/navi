import routes from '../../src/backend/orders.js';

describe('orders backend extension', () => {
  it('declares GET /ext/orders/summary.json', () => {
    const [route] = routes;
    expect(route.method).toBe('GET');
    expect(route.path).toBe('/ext/orders/summary.json');
  });

  it('writes a JSON summary', () => {
    let body;
    const response = { json: (payload) => { body = payload; } };
    new routes[0].handler({}, response).handle();
    expect(body.service).toBe('orders-extension');
    expect(typeof body.pending).toBe('number');
  });
});
