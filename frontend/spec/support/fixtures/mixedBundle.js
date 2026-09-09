import { createElement } from 'react';

const render = (label) => () => createElement('div', null, label);

export default [
  { path: '/ext/valid', text: 'Valid', component: render('Valid') },
  { path: 'missing-leading-slash', text: 'Bad', component: render('Bad') },
  { path: '/ext/also-valid', text: 'Also Valid', component: render('Also Valid') },
];
