export const fetchItems = (categoryId, queryString = '') => {
  const url = `/categories/${categoryId}/items.json${queryString ? `?${queryString}` : ''}`;

  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json().then((data) => ({
        data,
        pagination: {
          page: Number(res.headers.get('PAGE')),
          pageSize: Number(res.headers.get('PAGE-SIZE')),
          pages: Number(res.headers.get('PAGES')),
        },
      }));
    });
};

export const fetchItem = (categoryId, id) => {
  return fetch(`/categories/${categoryId}/items/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};
