import Utils from '@requestnetwork/utils';
import { expect } from 'chai';
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

    // Any port number can be used since we use supertest
    server = requestNodeInstance.listen(3000, () => 0);
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

    // wait a bit for the confirmation
    await new Promise((resolve): any => setTimeout(resolve, 5000));

    const serverResponse = await request(server)
      .get('/getConfirmedTransaction')
      .query({ transactionHash })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    expect(
      serverResponse.body.result,
      'getConfirmedTransaction request result should always be empty',
    ).to.be.empty;
    expect(
      serverResponse.body.meta.storageMeta.state,
      'getConfirmedTransaction request meta',
    ).to.be.equal('confirmed');
  });

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .get('/getConfirmedTransaction')
      .query({})
      .set('Accept', 'application/json')
      .expect(httpStatus.UNPROCESSABLE_ENTITY);
  });
});
