const axios = require('axios');
const RequestFailed = require('./exceptions/RequestFailed');

class ResourceRequest {
  constructor({ url, status }) {
    this.url = url;
    this.status = status;
  }

  async request() {
    try {
      const response = await axios.get(this.url);
      if (response.status === this.status) {
        return true;
      } else {
        throw new RequestFailed(response.status);
      }
    } catch (error) {
      if (error.response) {
        throw new RequestFailed(error.response.status);
      }
      throw error;
    }
  }
}

module.exports = { ResourceRequest };
