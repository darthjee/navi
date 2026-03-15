class JobFactory {
  static create(payload) {
    return {
      id: generateUniqueId(),
      payload: payload
    };
  }
}
