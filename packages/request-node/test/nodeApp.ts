import { expect } from 'chai';
import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import server from '../src/server';

describe('requestNode server', () => {
  after(() => {
    server.close();
  });

  it('any request should respond with status 404', async () => {
    request(server)
      .post('/')
      .end((_err, res) => {
        expect(res.status).to.equal(httpStatus.NOT_FOUND);
      });
  });
});
