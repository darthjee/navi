export const fetchItems = (categoryId) => {
  return fetch(`/categories/${categoryId}/items.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export const fetchItem = (categoryId, id) => {
  return fetch(`/categories/${categoryId}/items/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};
