const axios = require('axios');
const RequestFailed = require('../exceptions/RequestFailed');

class ResourceRequest {
  constructor({ url, status }) {
    this.url = url;
    this.status = status;
  }

  async check() {
    try {
      return await this.#request();
    } catch (error) {
      if (error.response) {
        throw new RequestFailed(error.response.status, this.url);
      }
      throw error;
    }
  }

  async #request() {
    const response = await axios.get(this.url);
    if (response.status === this.status) {
      return true;
    } else {
      throw new RequestFailed(response.status, this.url);
    }
  }
}

module.exports = { ResourceRequest };
