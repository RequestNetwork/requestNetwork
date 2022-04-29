import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { RequestNodeBase } from '../../src/requestNodeBase';
import { TheGraphRequestNode } from '../../src/thegraph';
import * as NodeConfig from '../../src/config';
import * as core from 'express-serve-static-core';
import { IpfsGatewayProtocol } from '@requestnetwork/types/src/storage-types';

const subgraphUrl = 'http://localhost:8000/subgraphs/name/RequestNetwork/request-storage';
const channelId = '010aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const topics = [
  '010ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  '010ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
];
const transactionData = { data: 'this is sample data for a transaction' };

let requestNodeInstance: RequestNodeBase;
let server: core.Express;

describe('persistTransaction', () => {
  beforeAll(async () => {
    requestNodeInstance = new TheGraphRequestNode(subgraphUrl);
    await requestNodeInstance.initialize();
    server = (requestNodeInstance as any).express;
  });

  afterAll(async () => {
    await requestNodeInstance.close();
    jest.restoreAllMocks();
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
    // recreate server with low timeout
    await requestNodeInstance.close();
    jest.spyOn(NodeConfig, 'getIpfsConfiguration').mockReturnValue({
      host: 'localhost',
      port: 5001,
      protocol: IpfsGatewayProtocol.HTTP,
      timeout: 1,
    });
    requestNodeInstance = new TheGraphRequestNode(subgraphUrl);
    await requestNodeInstance.initialize();
    server = (requestNodeInstance as any).express;

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
