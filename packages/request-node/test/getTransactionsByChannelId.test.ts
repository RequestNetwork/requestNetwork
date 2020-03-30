import 'mocha';

import { expect } from 'chai';
import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import requestNode from '../src/requestNode';

const channelId = '01aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab';
const anotherChannelId = '01bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbc';
const nonExistentChannelId = '01cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccd';
const transactionData = {
  data: 'this is sample data for a transaction to test getTransactionsByChannelId',
};
const otherTransactionData = {
  data: 'this is other sample data for a transaction to test getTransactionsByChannelId',
};

let requestNodeInstance;
let server: any;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('getTransactionsByChannelId', () => {
  before(async () => {
    requestNodeInstance = new requestNode();
    await requestNodeInstance.initialize();

    // Any port number can be used since we use supertest
    server = requestNodeInstance.listen(3000, () => 0);
  });

  after(() => {
    server.close();
  });

  it('responds with the correct transactions to requests with an existing channel id', async () => {
    await request(server)
      .post('/persistTransaction')
      .send({
        channelId,
        transactionData,
      })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    let serverResponse = await request(server)
      .get('/getTransactionsByChannelId')
      .query({ channelId })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    expect(serverResponse.body.result.transactions).to.have.lengthOf(1);
    expect(serverResponse.body.result.transactions[0].transaction).to.deep.equal(transactionData);

    await request(server)
      .post('/persistTransaction')
      .send({
        channelId: anotherChannelId,
        transactionData: otherTransactionData,
      })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    serverResponse = await request(server)
      .get('/getTransactionsByChannelId')
      .query({ channelId: anotherChannelId })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    expect(serverResponse.body.result.transactions).to.have.lengthOf(1);
    expect(serverResponse.body.result.transactions[0].transaction).to.deep.equal(
      otherTransactionData,
    );
  });

  it('responds with no transaction to requests with a non-existent channel id', async () => {
    const serverResponse = await request(server)
      .get('/getTransactionsByChannelId')
      .query({ channelId: nonExistentChannelId })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK);

    expect(serverResponse.body.result.transactions).to.be.empty;
  });

  it('responds with status 422 to requests with no value', async () => {
    await request(server)
      .get('/getTransactionsByChannelId')
      .set('Accept', 'application/json')
      .expect(httpStatus.UNPROCESSABLE_ENTITY);
  });
});
