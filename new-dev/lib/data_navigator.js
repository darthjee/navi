class DataNavigator {
  constructor(data, steps) {
    this._data = data;
    this._steps = steps;
  }

  navigate() {
    let current = this._data;

    for (const step of this._steps) {
      if (current === null || current === undefined) return null;

      if (typeof step === 'number') {
        current = current.find((item) => item.id === step);
      } else {
        current = current[step];
      }
    }

    return current ?? null;
  }
}

export default DataNavigator;
