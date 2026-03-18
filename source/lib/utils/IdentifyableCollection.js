class IdentifyableCollection {
  constructor(items = []) {
    this.items = items;
  }

  push(item) {
    this.items.push(item);
  }

  shift() {
    return this.items.shift();
  }
  
}
