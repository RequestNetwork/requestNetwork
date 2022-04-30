import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { RequestNodeBase } from '../../src/requestNodeBase';
import { TheGraphRequestNode } from '../../src/thegraph';
import * as core from 'express-serve-static-core';

const subgraphUrl = 'http://localhost:8000/subgraphs/name/RequestNetwork/request-storage';
const channelId = '010aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const topics = [
  '010ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  '010ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
];
const transactionData = { data: 'this is sample data for a transaction' };

let requestNodeInstance: RequestNodeBase;
let server: core.Express;

const axiosMock = new MockAdapter(axios);

describe('persistTransaction', () => {
  beforeAll(async () => {
    axiosMock.onAny().passThrough();
    requestNodeInstance = new TheGraphRequestNode(subgraphUrl);
    await requestNodeInstance.initialize();
    server = (requestNodeInstance as any).express;
  });

  afterAll(async () => {
    await requestNodeInstance.close();
    jest.restoreAllMocks();
    axiosMock.reset();
  });

  it('responds with status 200 to requests with correct values', async () => {
    let serverResponse = await request(server)
      .post('/persistTransaction')
      .send({ channelId, topics, transactionData })
      .set('Accept', 'application/json')
      .expect(StatusCodes.OK);
    expect(serverResponse.body.result).toMatchObject({});
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
