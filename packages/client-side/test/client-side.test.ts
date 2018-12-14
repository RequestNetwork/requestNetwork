import { assert } from 'chai';
import 'mocha';
import ClientSide from '../src/client-side';

const axios = require('axios');
const mockAdapter = require('axios-mock-adapter');

describe('index', () => {
  beforeEach(async () => {
    const mock = new mockAdapter(axios);
    mock.onPost('/createRequest').reply(200, { requestId: '0xa' });
  });
  it('works', async () => {
    const { data } = await ClientSide.createRequest({ payer: '0x1', payee: '0x2' });
    assert.equal(data.requestId, '0xa');
  });
});
