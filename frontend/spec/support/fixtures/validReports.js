import { createElement } from 'react';

export default [
  {
    path: '/ext/reports',
    text: 'Reports',
    component: () => createElement('div', { className: 'ext-reports' }, 'Reports Page'),
  },
];
