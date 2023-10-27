import { normalizeKeccak256Hash } from '@requestnetwork/utils';
import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { getRequestNode } from '../src/server';
import { RequestNode } from '../src/requestNode';
import { providers } from 'ethers';

const channelId = '010aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const transactionData = { data: 'this is sample data for a transaction' };
const transactionHash = normalizeKeccak256Hash(transactionData).value;
const provider = new providers.JsonRpcProvider('http://localhost:8545');

let requestNodeInstance: RequestNode;
let server: any;

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('getConfirmedTransaction', () => {
  beforeAll(async () => {
    requestNodeInstance = getRequestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(async () => {
    await requestNodeInstance.close();
  });

  it('responds with status 200 to requests with correct values', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({ channelId, transactionData })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    await request(server)
      .get('/getConfirmedTransaction')
      .query({ transactionHash })
      .set('Accept', 'application/json')
      .expect(StatusCodes.NOT_FOUND);

    // mining is required for TheGraph to index data
    await provider.send('evm_mine', []);

    let serverResponse: request.Response | undefined;
    // retry mechanism to account for ganache delay
    for (let i = 0; i < 10; i++) {
      // wait a bit for the confirmation
      await new Promise((resolve): any => setTimeout(resolve, 1000));

      serverResponse = await request(server)
        .get('/getConfirmedTransaction')
        .query({ transactionHash })
        .set('Accept', 'application/json');
      if (serverResponse.status === StatusCodes.OK) {
        break;
      }
    }
    expect(serverResponse).toBeDefined();
    expect(serverResponse!.status).toBe(StatusCodes.OK);

    expect(serverResponse!.body.result).toMatchObject({});
    // 'getConfirmedTransaction request meta'
    expect(serverResponse!.body.meta.storageMeta.state).toBe('confirmed');
  }, 30000);

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .get('/getConfirmedTransaction')
      .query({})
      .set('Accept', 'application/json')
      .expect(StatusCodes.UNPROCESSABLE_ENTITY);
  });
});
