import { handleResponse } from './responseHandler.js';

export const fetchItems = (categoryId, queryString = '') => {
  const url = `/categories/${categoryId}/items.json${queryString ? `?${queryString}` : ''}`;

  return fetch(url).then(handleResponse);
};

export const fetchItem = (categoryId, id) => {
  return fetch(`/categories/${categoryId}/items/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};
