class NamedRegistry {
  constructor(items) {
    this.items = items;
  }
  getItem(name) {
    if (name in this.items) {
      return this.items[name];
    }
    throw new Error(`Item "${name}" not found.`);
  }
}