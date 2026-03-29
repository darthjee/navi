import request from 'supertest';
import buildApp from '../app.js';

const data = {
  categories: [
    {
      id: 1,
      name: 'Books',
      items: [
        { id: 1, name: 'The Hobbit' },
        { id: 2, name: 'The Lord of the Rings' },
        { id: 3, name: 'The Silmarillion' },
      ],
    },
    {
      id: 2,
      name: 'Movies',
      items: [
        { id: 4, name: 'The Shawshank Redemption' },
        { id: 5, name: 'The Godfather' },
        { id: 6, name: 'The Dark Knight' },
      ],
    },
    {
      id: 3,
      name: 'Music',
      items: [
        { id: 7, name: 'The Beatles' },
        { id: 8, name: 'Nirvana' },
        { id: 9, name: 'Queen' },
      ],
    },
  ],
};

const app = buildApp(data);

describe('GET /categories.json', () => {
  it('returns all categories without items', async () => {
    const res = await request(app).get('/categories.json');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].items).toBeUndefined();
  });
});

describe('GET /categories/:id.json', () => {
  it('returns the category', async () => {
    const res = await request(app).get('/categories/1.json');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/categories/999.json');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories/:id/items.json', () => {
  it('returns items for the category', async () => {
    const res = await request(app).get('/categories/1/items.json');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 404 for unknown category', async () => {
    const res = await request(app).get('/categories/999/items.json');
    expect(res.status).toBe(404);
  });
});

describe('GET /categories/:id/items/:item_id.json', () => {
  it('returns the item', async () => {
    const res = await request(app).get('/categories/1/items/1.json');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown item', async () => {
    const res = await request(app).get('/categories/1/items/999.json');
    expect(res.status).toBe(404);
  });
});

describe('unmatched routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
