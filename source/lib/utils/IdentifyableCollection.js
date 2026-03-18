import { randomUUID } from 'crypto';

class IdentifyableCollection {
  constructor(items = {}) {
    this.items = items;
  }

  push(item) {
    this.items[item.id] = item;
  }

  generateUUID() {
    let id;

    do {
      id = randomUUID();
    } while (this.items[id]);

    return id;
  }
}
