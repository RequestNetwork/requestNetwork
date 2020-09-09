import * as httpStatus from 'http-status-codes';
import * as request from 'supertest';
import requestNode from '../src/requestNode';

let requestNodeInstance;
let server: any;

// tslint:disable:no-magic-numbers
// tslint:disable:no-unused-expression
describe('ipfsAdd', () => {
  beforeAll(async () => {
    requestNodeInstance = new requestNode();
    await requestNodeInstance.initialize();

    server = (requestNodeInstance as any).express;
  });

  afterAll(() => {
    server.close();
  });

  it('responds with status 200 to requests with correct values', async () => {
    const blockString = JSON.stringify({
      header: {
        channelIds: { '01ae1a665f3c4ebd7599fe32d30eb21cc6118097d485deee911118b143b92be12d': [0] },
        topics: {
          '01ae1a665f3c4ebd7599fe32d30eb21cc6118097d485deee911118b143b92be12d': [
            '01f1a21ab419611dbf492b3136ac231c8773dc897ee0eb5167ef2051a39e685e76',
          ],
        },
        version: '0.1.0',
      },
      transactions: [
        {
          data:
            '{"data":{"name":"create","parameters":{"currency":{"type":"BTC","value":"BTC"},"expectedAmount":"1000","payee":{"type":"ethereumAddress","value":"0x627306090abab3a6e1400e9345bc60c78a8bef57"},"payer":{"type":"ethereumAddress","value":"0xf17f52151ebef6c7334fad080c5704d77216b732"},"extensionsData":[],"timestamp":1578884046},"version":"2.0.2"},"signature":{"method":"ecdsa","value":"0x82dac7769e5ea7889d1916205de71628ad14bd152d9d4341c9e6d3401425a60f32a2c5ca998260dfc5d8c6575b564efc1bd8018fd1576d1920b8296caa6407521c"}}',
        },
      ],
    });
    await request(server)
      .post('/ipfsAdd')
      .send({ data: blockString })
      .set('Accept', 'application/json')
      .expect(httpStatus.OK)
      .expect({
        ipfsHash: 'QmaViWwahWwCU7DgYBLYwfvBuEU9bj3F3rmLDoAS5ujqXX',
        ipfsSize: 1026,
      });
  });

  it('responds with status 400 to requests with no value', async () => {
    await request(server)
      .post('/ipfsAdd')
      .send({})
      .set('Accept', 'application/json')
      .expect(httpStatus.BAD_REQUEST);
  });

  it('responds with status 400 to requests with badly formatted value', async () => {
    await request(server)
      .post('/ipfsAdd')
      .send({
        data: 'not parsable',
      })
      .set('Accept', 'application/json')
      .expect(httpStatus.BAD_REQUEST);
  });
});
