import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import requestNode from '../src/requestNode';

const channelId = '010aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const anotherChannelId = '010bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const topics = [
  '010ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  '010ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
];
const transactionData = { data: 'this is sample data for a transaction' };
const anotherTransactionData = { data: 'you can put any data' };
const badlyFormattedTransactionData = { not: 'a transaction' };

let requestNodeInstance;
let server: any;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('persistTransaction', () => {
  beforeAll(async () => {
    requestNodeInstance = new requestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
    server.close();
  });

  it('responds with status 200 to requests with correct values', async () => {
    let serverResponse = await request(server)
      .post('/persistTransaction')
      .send({ channelId, topics, transactionData })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    expect(serverResponse.body.result).toMatchObject({});

    // topics parameter should be optional
    serverResponse = await request(server)
      .post('/persistTransaction')
      .send({ channelId: anotherChannelId, transactionData: anotherTransactionData })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    expect(serverResponse.body.result).toMatchObject({});
  });

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({})
      .set('Accept', 'application/json')
      .expect(httpStatus.UNPROCESSABLE_ENTITY);
  });

  it('responds with status 500 to requests with badly formatted value', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({
        channelId,
        transactionData: badlyFormattedTransactionData,
      })
      .set('Accept', 'application/json')
      .expect(httpStatus.INTERNAL_SERVER_ERROR);
  });
});
