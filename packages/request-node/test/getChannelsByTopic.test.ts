import { StatusCodes } from 'http-status-codes';
import { getRequestNode } from '../src/server';
import request from 'supertest';
import { RequestNode } from '../src/requestNode';

// enable re-running these tests on local environment by having a different channel ID each time.
const time = Date.now();
const channelId = `01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa${time}`;
const anotherChannelId = `01bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb${time}`;

const commonTopic = [`01ccccccccccccccccccccccccccccccccccccccccccccccccccc${time}`];
const topics = [`01ddddddddddddddddddddddddddddddddddddddddddddddddddd${time}`].concat(commonTopic);
const otherTopics = [`01eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee${time}`].concat(
  commonTopic,
);
const nonExistentTopic = '010000000000000000000000000000000000000000000000000000000000000000';
const transactionData = {
  data: 'this is sample data for a transaction to test getChannelsByTopic',
};
const otherTransactionData = {
  data: 'this is other sample data for a transaction to test getChannelsByTopic',
};

let requestNodeInstance: RequestNode;
let server: any;

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('getChannelsByTopic', () => {
  beforeAll(async () => {
    requestNodeInstance = getRequestNode();
    await requestNodeInstance.initialize();
    server = (requestNodeInstance as any).express;
  });

  afterAll(async () => {
    await requestNodeInstance.close();
    server.close();
  });

  it('responds with the correct transactions to requests with an existing topic', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({
        channelId,
        topics,
        transactionData,
      })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    let serverResponse = await request(server)
      .get('/getChannelsByTopic')
      .query({ topic: topics[0] })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toMatchObject(
      expect.objectContaining({
        [channelId]: [expect.objectContaining({ transaction: transactionData })],
      }),
    );

    await request(server)
      .post('/persistTransaction')
      .send({
        channelId: anotherChannelId,
        topics: otherTopics,
        transactionData: otherTransactionData,
      })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    serverResponse = await request(server)
      .get('/getChannelsByTopic')
      .query({ topic: otherTopics[0] })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toMatchObject(
      expect.objectContaining({
        [anotherChannelId]: [expect.objectContaining({ transaction: otherTransactionData })],
      }),
    );

    // If we search for the common topic, there should be two transaction
    serverResponse = await request(server)
      .get('/getChannelsByTopic')
      .query({ topic: commonTopic })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toMatchObject(
      expect.objectContaining({
        [channelId]: [expect.objectContaining({ transaction: transactionData })],
        [anotherChannelId]: [expect.objectContaining({ transaction: otherTransactionData })],
      }),
    );
  });

  it('responds with no transaction to requests with a non-existent topic', async () => {
    const serverResponse = await request(server)
      .get('/getChannelsByTopic')
      .query({ topic: nonExistentTopic })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toMatchObject({});
  });

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .get('/getChannelsByTopic')
      .set('Accept', 'application/json')
      .expect(StatusCodes.UNPROCESSABLE_ENTITY);
  });
});
