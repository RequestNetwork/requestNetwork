/* eslint-disable spellcheck/spell-checker */
import Utils from '@requestnetwork/utils';
import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import requestNode from '../src/requestNode';

const channelId = '010aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const transactionData = { data: 'this is sample data for a transaction' };
const transactionHash = Utils.crypto.normalizeKeccak256Hash(transactionData).value;

let requestNodeInstance;
let server: any;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('getConfirmedTransaction', () => {
  beforeAll(async () => {
    requestNodeInstance = new requestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
    server.close();
  });

  it('responds with status 200 to requests with correct values', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({ channelId, transactionData })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    await request(server)
      .get('/getConfirmedTransaction')
      .query({ transactionHash })
      .set('Accept', 'application/json')
      .expect(httpStatus.NOT_FOUND);

    let serverResponse: request.Response | undefined;
    // retry mechanism to account for ganache delay
    for (let i = 0; i < 10; i++) {
      // wait a bit for the confirmation
      await new Promise((resolve): any => setTimeout(resolve, 1000));

      serverResponse = await request(server)
        .get('/getConfirmedTransaction')
        .query({ transactionHash })
        .set('Accept', 'application/json');
      if (serverResponse.status === httpStatus.OK) {
        break;
      }
    }
    expect(serverResponse).toBeDefined();
    expect(serverResponse!.status).toBe(httpStatus.OK);

    expect(serverResponse!.body.result).toMatchObject({});
    // 'getConfirmedTransaction request meta'
    expect(serverResponse!.body.meta.storageMeta.state).toBe('confirmed');
  }, 11000);

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .get('/getConfirmedTransaction')
      .query({})
      .set('Accept', 'application/json')
      .expect(httpStatus.UNPROCESSABLE_ENTITY);
  });
});
