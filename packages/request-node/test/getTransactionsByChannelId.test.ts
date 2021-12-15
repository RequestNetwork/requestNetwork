import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { RequestNode } from '../src/requestNode';

const channelId = '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab';
const anotherChannelId = '01bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbc';
const nonExistentChannelId = '01cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccd';
const transactionData = {
  data: 'this is sample data for a transaction to test getTransactionsByChannelId',
};
const otherTransactionData = {
  data: 'this is other sample data for a transaction to test getTransactionsByChannelId',
};

let requestNodeInstance;
let server: any;

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('getTransactionsByChannelId', () => {
  beforeAll(async () => {
    requestNodeInstance = new RequestNode();
    await requestNodeInstance.initialize();
    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
    server.close();
  });

  it('responds with the correct transactions to requests with an existing channel id', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({
        channelId,
        transactionData,
      })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    let serverResponse = await request(server)
      .get('/getTransactionsByChannelId')
      .query({ channelId })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toHaveLength(1);
    expect(serverResponse.body.result.transactions[0].transaction).toEqual(transactionData);

    await request(server)
      .post('/persistTransaction')
      .send({
        channelId: anotherChannelId,
        transactionData: otherTransactionData,
      })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    serverResponse = await request(server)
      .get('/getTransactionsByChannelId')
      .query({ channelId: anotherChannelId })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toHaveLength(1);
    expect(serverResponse.body.result.transactions[0].transaction).toEqual(otherTransactionData);
  });

  it('responds with no transaction to requests with a non-existent channel id', async () => {
    const serverResponse = await request(server)
      .get('/getTransactionsByChannelId')
      .query({ channelId: nonExistentChannelId })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toMatchObject({});
  });

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .get('/getTransactionsByChannelId')
      .set('Accept', 'application/json')
      .expect(StatusCodes.UNPROCESSABLE_ENTITY);
  });
});
