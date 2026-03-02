import axios from 'axios';
import { RequestFailed } from '../exceptions/RequestFailed.js';

class Requester {
  constructor(resourceRequest) {
    this.resourceRequest = resourceRequest;
  }

  async perform() {
    try {
      return await this.#request();
    } catch (error) {
      if (error.response) {
        throw new RequestFailed(error.response.status, this.resourceRequest.url);
      }
      throw error;
    }
  }

  async #request() {
    const response = await axios.get(this.resourceRequest.url);
    if (response.status === this.resourceRequest.status) {
      return true;
    } else {
      throw new RequestFailed(response.status, this.resourceRequest.url);
    }
  }
}

export { Requester };