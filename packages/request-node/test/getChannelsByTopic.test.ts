import { StatusCodes } from 'http-status-codes';
import { getRequestNode } from '../src/server';
import request from 'supertest';
import { RequestNode } from '../src/requestNode';
import { normalizeKeccak256Hash } from '@requestnetwork/utils';
import { providers } from 'ethers';

jest.setTimeout(30000);
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
  data: `this is sample data for a transaction to test getChannelsByTopic ${Date.now()}`,
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

    // If we search for the fisrt topic, by paginating, there should be one transaction
    serverResponse = await request(server)
      .get('/getChannelsByTopic')
      .query({ topic: commonTopic, page: 1, pageSize: 1 })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result.transactions).toMatchObject(
      expect.objectContaining({
        [channelId]: [expect.objectContaining({ transaction: transactionData })],
      }),
    );

    // confirm the transactions for clean shutdown
    const provider = new providers.JsonRpcProvider();
    const confirm = (txData: unknown) => {
      const transactionHash = normalizeKeccak256Hash(txData).value;
      return new Promise<void>((r) => {
        const i = setInterval(async () => {
          await provider.send('evm_mine', []);
          const res = await request(server)
            .get('/getConfirmedTransaction')
            .query({ transactionHash });
          if (res.status === 200) {
            clearInterval(i);
            return r();
          }
        }, 200);
      });
    };
    await Promise.all([confirm(transactionData), confirm(otherTransactionData)]);
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
