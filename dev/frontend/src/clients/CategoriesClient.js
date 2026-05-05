import { handleResponse } from './responseHandler.js';

export const fetchCategories = (queryString = '') => {
  const url = `/categories.json${queryString ? `?${queryString}` : ''}`;

  return fetch(url).then(handleResponse);
};

export const fetchCategory = (id) => {
  return fetch(`/categories/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};
