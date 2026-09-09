import { createElement } from 'react';

export default [
  {
    path: '/ext/metrics',
    text: 'Metrics',
    component: () => createElement('div', { className: 'ext-metrics' }, 'Metrics Page'),
  },
];
