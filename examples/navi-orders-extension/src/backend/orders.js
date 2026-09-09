import { RequestHandler } from 'navi-hey/extension';

class OrdersSummaryHandler extends RequestHandler {
  constructor(_request, response) {
    super();
    this.response = response;
  }

  handle() {
    this.response.json({ pending: 3, service: 'orders-extension' });
  }
}

export default [
  { method: 'GET', path: '/ext/orders/summary.json', handler: OrdersSummaryHandler },
];
