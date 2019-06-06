import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import requestNode from '../src/requestNode';

// Extends chai for promises
chai.use(chaiAsPromised);
const expect = chai.expect;

const dataAccessInitializeFailureMock = async () => {
  throw Error('This mock function always fails');
};

let requestNodeInstance;
let server: any;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('requestNode server', () => {
  before(async () => {
    requestNodeInstance = new requestNode();
    await requestNodeInstance.initialize();

    // Any port number can be used since we use supertest
    server = requestNodeInstance.listen(3000, () => 0);
  });

  after(() => {
    server.close();
  });

  it('responds with status 404 to unimplemented requests', async () => {
    await request(server)
      .post('/')
      .end((_err, res) => {
        expect(res.status).to.equal(httpStatus.NOT_FOUND);
      });
  });

  it('responds with status 503 if server is uninitialized', async () => {
    // Import directly requestNode to create a server where we don't call requestNodeInstance.initialize()
    requestNodeInstance = new requestNode();
    const notInitializedServer = requestNodeInstance.listen(3001, () => 0);

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

    expect(requestNodeInstance.initialize()).to.be.rejectedWith(Error);
  });

  it('serves custom headers', async () => {
    // Import directly requestNode to create a server
    process.env.HEADERS = '{"x-custom-test-header": "test-passed"}';
    requestNodeInstance = new requestNode();
    server = requestNodeInstance.listen(3002, () => 0);

    await request(server)
      .post('/')
      .expect('x-custom-test-header', 'test-passed');
  });

  it('must throw if no mnemonic given with rinkeby', async () => {
    process.env.ETHEREUM_NETWORK_ID = '4';

    expect(() => {
      new requestNode();
    }, 'must throw').to.throw(
      'the environment variable MNEMONIC must be set up. The default mnemonic is only for private network.',
    );
  });
});
