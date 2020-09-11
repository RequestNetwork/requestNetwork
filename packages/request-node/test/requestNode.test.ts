/* eslint-disable spellcheck/spell-checker */
import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import requestNode from '../src/requestNode';

const packageJson = require('../package.json');
const requestNodeVersion = packageJson.version;

const dataAccessInitializeFailureMock = async (): Promise<never> => {
  throw Error('This mock function always fails');
};

let requestNodeInstance;
let server: any;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('requestNode server', () => {
  beforeAll(async () => {
    requestNodeInstance = new requestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
    server.close();
  });

  it('responds with status 404 to unimplemented requests', async () => {
    await request(server).post('/').expect(httpStatus.NOT_FOUND);
  });

  it('responds with status 200 to health check requests', async () => {
    await request(server).get('/healthz').expect(httpStatus.OK);
  });

  it('responds with status 200 to readyness check requests when ready', async () => {
    await request(server).get('/readyz').expect(httpStatus.OK);
  });

  it('responds with status 503 to readyness check requests when not ready', async () => {
    requestNodeInstance = new requestNode();
    server = (requestNodeInstance as any).express;
    await request(server).get('/readyz').expect(httpStatus.SERVICE_UNAVAILABLE);
  });

  it('responds with status 503 if server is uninitialized', async () => {
    // Import directly requestNode to create a server where we don't call requestNodeInstance.initialize()
    requestNodeInstance = new requestNode();
    const notInitializedServer = (requestNodeInstance as any).express;

    await request(notInitializedServer)
      .post('/persistTransaction')
      .set('Accept', 'application/json')
      .expect(httpStatus.SERVICE_UNAVAILABLE);

    await request(notInitializedServer)
      .get('/getTransactionsByChannelId')
      .set('Accept', 'application/json')
      .expect(httpStatus.SERVICE_UNAVAILABLE);
  });

  it('initialization failure should throw an error', async () => {
    requestNodeInstance = new requestNode();
    requestNodeInstance.dataAccess.initialize = dataAccessInitializeFailureMock;

    await expect(requestNodeInstance.initialize()).rejects.toThrowError(Error);
  });

  it('serves custom headers', async () => {
    // Import directly requestNode to create a server
    process.env.HEADERS = '{"x-custom-test-header": "test-passed"}';
    requestNodeInstance = new requestNode();
    server = (requestNodeInstance as any).express;

    await request(server).post('/').expect('x-custom-test-header', 'test-passed');
  });

  it('the response header contains the Request Node version', async () => {
    // Import directly requestNode to create a server
    requestNodeInstance = new requestNode();
    server = (requestNodeInstance as any).express;

    await request(server).post('/').expect('X-Request-Network-Node-Version', requestNodeVersion);
  });

  it('must throw if no mnemonic given with rinkeby', async () => {
    process.env.ETHEREUM_NETWORK_ID = '4';

    // 'must throw'
    expect(() => {
      new requestNode();
    }).toThrowError(
      'the environment variable MNEMONIC must be set up. The default mnemonic is only for private network.',
    );
  });
});
