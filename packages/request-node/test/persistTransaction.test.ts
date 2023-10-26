import axios from 'axios';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import MockAdapter from 'axios-mock-adapter';

import { getRequestNode } from '../src/server';
import { RequestNode } from '../src/requestNode';

const channelId = '010aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const anotherChannelId = '010bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const topics = [
  '010ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  '010ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
];
const transactionData = { data: 'this is sample data for a transaction' };
const anotherTransactionData = { data: 'you can put any data' };
const badlyFormattedTransactionData = { not: 'a transaction' };

let requestNodeInstance: RequestNode;
let server: any;

const axiosMock = new MockAdapter(axios);

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('persistTransaction', () => {
  beforeAll(async () => {
    axiosMock.onAny().passThrough();

    requestNodeInstance = getRequestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(async () => {
    await requestNodeInstance.close();
    server.close();
    jest.restoreAllMocks();
    axiosMock.reset();
  });

  it('responds with status 200 to requests with correct values', async () => {
    let serverResponse = await request(server)
      .post('/persistTransaction')
      .send({ channelId, topics, transactionData })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body).toMatchObject({ result: {} });

    // topics parameter should be optional
    serverResponse = await request(server)
      .post('/persistTransaction')
      .send({ channelId: anotherChannelId, transactionData: anotherTransactionData })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);

    expect(serverResponse.body.result).toMatchObject({});
  });

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({})
      .set('Accept', 'application/json')
      .expect(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  it('responds with status 500 to requests with badly formatted value', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({
        channelId,
        transactionData: badlyFormattedTransactionData,
      })
      .set('Accept', 'application/json')
      .expect(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it('should catch IPFS timeout error', async () => {
    axiosMock.reset();
    axiosMock.onAny().timeout();
    const assertionsNb = 10;
    const assertions = [];
    for (let i = 0; i < assertionsNb; i++) {
      assertions.push(
        request(server)
          .post('/persistTransaction')
          .send({ channelId, topics, transactionData })
          .set('Accept', 'application/json')
          .expect(StatusCodes.INTERNAL_SERVER_ERROR),
      );
    }
    await Promise.all(assertions);
  });
});
