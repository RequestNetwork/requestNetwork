import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { RequestNode } from '../src/requestNode';

const channelId = '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const anotherChannelId = '01bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const commonTopic = ['01cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'];
const topics = ['01dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'].concat(
  commonTopic,
);
const otherTopics = ['01eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'].concat(
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
    requestNodeInstance = new RequestNode();
    await requestNodeInstance.initialize();
    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
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

    expect(Object.keys(serverResponse.body.result.transactions[channelId])).toHaveLength(1);
    expect(serverResponse.body.result.transactions[channelId][0].transaction).toEqual(
      transactionData,
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
    expect(Object.keys(serverResponse.body.result.transactions[anotherChannelId])).toHaveLength(1);
    expect(serverResponse.body.result.transactions[anotherChannelId][0].transaction).toEqual(
      otherTransactionData,
    );

    // If we search for the common topic, there should be two transaction
    serverResponse = await request(server)
      .get('/getChannelsByTopic')
      .query({ topic: commonTopic })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(Object.keys(serverResponse.body.result.transactions[channelId])).toHaveLength(1);
    expect(Object.keys(serverResponse.body.result.transactions[anotherChannelId])).toHaveLength(1);
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
