export const fetchCategories = () => {
  return fetch('/categories.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};

export const fetchCategory = (id) => {
  return fetch(`/categories/${id}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
};
