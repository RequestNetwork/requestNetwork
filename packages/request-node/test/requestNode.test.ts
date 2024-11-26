import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { getRequestNode } from '../src/server';
import { RequestNode } from '../src/requestNode';

jest.setTimeout(20000);
const packageJson = require('../package.json');
const requestNodeVersion = packageJson.version;

const dataAccessInitializeFailureMock = async (): Promise<never> => {
  throw Error('This mock function always fails');
};

let requestNodeInstance: RequestNode;
let server: any;

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('requestNode server', () => {
  beforeAll(async () => {
    requestNodeInstance = getRequestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(async () => {
    await requestNodeInstance.close();
  });

  it('responds with status 404 to unimplemented requests', async () => {
    await request(server).post('/').expect(StatusCodes.NOT_FOUND);
  });

  it('responds with status 200 to health check requests', async () => {
    await request(server).get('/healthz').expect(StatusCodes.OK);
  });

  it('responds with status 200 to readyness check requests when ready', async () => {
    await request(server).get('/readyz').expect(StatusCodes.OK);
  });

  it('responds with status 503 to readyness check requests when not ready', async () => {
    requestNodeInstance = getRequestNode();
    server = (requestNodeInstance as any).express;
    await request(server).get('/readyz').expect(StatusCodes.SERVICE_UNAVAILABLE);
  });

  it('responds with status 503 if server is uninitialized', async () => {
    // Import directly requestNode to create a server where we don't call requestNodeInstance.initialize()
    requestNodeInstance = getRequestNode();
    const notInitializedServer = (requestNodeInstance as any).express;

    await request(notInitializedServer)
      .post('/persistTransaction')
      .set('Accept', 'application/json')
      .expect(StatusCodes.SERVICE_UNAVAILABLE);

    await request(notInitializedServer)
      .get('/getTransactionsByChannelId')
      .set('Accept', 'application/json')
      .expect(StatusCodes.SERVICE_UNAVAILABLE);
  });

  it('initialization failure should throw an error', async () => {
    requestNodeInstance = getRequestNode();
    jest
      .spyOn((requestNodeInstance as any).dataAccess, 'initialize')
      .mockImplementation(dataAccessInitializeFailureMock);

    await expect(requestNodeInstance.initialize()).rejects.toThrowError(Error);
  });

  it('the response header contains the Request Node version', async () => {
    // Import directly requestNode to create a server
    requestNodeInstance = getRequestNode();
    server = (requestNodeInstance as any).express;

    await request(server).post('/').expect('X-Request-Network-Node-Version', requestNodeVersion);
  });

  it('must throw if no mnemonic given with rinkeby', async () => {
    process.env.ETHEREUM_NETWORK_ID = '4';

    // 'must throw'
    expect(() => getRequestNode()).toThrowError(
      'the environment variable MNEMONIC must be set up. The default mnemonic is only for private network.',
    );
  });
});
