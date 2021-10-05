import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import RequestNode from '../src/requestNode';

const packageJson = require('../package.json');
const requestNodeVersion = packageJson.version;

const dataAccessInitializeFailureMock = async (): Promise<never> => {
  throw Error('This mock function always fails');
};

let requestNodeInstance;
let server: any;

/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('requestNode server', () => {
  beforeAll(async () => {
    requestNodeInstance = new RequestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
    server.close();
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
    requestNodeInstance = new RequestNode();
    server = (requestNodeInstance as any).express;
    await request(server).get('/readyz').expect(StatusCodes.SERVICE_UNAVAILABLE);
  });

  it('responds with status 503 if server is uninitialized', async () => {
    // Import directly requestNode to create a server where we don't call requestNodeInstance.initialize()
    requestNodeInstance = new RequestNode();
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
    requestNodeInstance = new RequestNode();
    requestNodeInstance.dataAccess.initialize = dataAccessInitializeFailureMock;

    await expect(requestNodeInstance.initialize()).rejects.toThrowError(Error);
  });

  it('serves custom headers', async () => {
    // Import directly requestNode to create a server
    process.env.HEADERS = '{"x-custom-test-header": "test-passed"}';
    requestNodeInstance = new RequestNode();
    server = (requestNodeInstance as any).express;

    await request(server).post('/').expect('x-custom-test-header', 'test-passed');
  });

  it('the response header contains the Request Node version', async () => {
    // Import directly requestNode to create a server
    requestNodeInstance = new RequestNode();
    server = (requestNodeInstance as any).express;

    await request(server).post('/').expect('X-Request-Network-Node-Version', requestNodeVersion);
  });

  it('must throw if no mnemonic given with rinkeby', async () => {
    process.env.ETHEREUM_NETWORK_ID = '4';

    // 'must throw'
    expect(() => new RequestNode()).toThrowError(
      'the environment variable MNEMONIC must be set up. The default mnemonic is only for private network.',
    );
  });
});
