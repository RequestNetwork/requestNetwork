const axios = require('axios');

export default {
  async createRequest(request: { payer: string; payee: string }): Promise<any> {
    return axios.post('/createRequest', request);
  },
};
