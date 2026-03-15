class Queue {
  constructor() {
    this.items = [];
  }

  push(item) {
    this.items.push(item);
  }

  pick() {
    return this.items.shift();
  }

  hasItem() {
    return this.items.length > 0;
  }
}

export { Queue };