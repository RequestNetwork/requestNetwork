// tslint:disable: no-invalid-this
// tslint:disable: no-magic-numbers
import ProxyERC20InfoRetriever from '../../../../src/api/payment-network/erc20/proxy-info-retriever';

import 'chai';
import 'mocha';
import { EVENTS_NAMES } from '../../../../src/types';

const chai = require('chai');
const expect = chai.expect;

const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const proxyContractAddress = '0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4';
const requestIdMock = '0111111111111111111111111111111111111111111111111';

/* tslint:disable:no-unused-expression */
describe.only('api/erc20/proxy-info-retriever', () => {
  describe('on localhost', () => {
    const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
    const payerAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
    const emptyAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';

    it('can get the localhost balance of an address', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        requestIdMock,
        proxyContractAddress,
        erc20LocalhostContractAddress,
        paymentAddress,
        EVENTS_NAMES.PAYMENT,
        'private',
      );
      const events = await infoRetriever.getTransferEvents();

      // if this assert fails it means this address received another transaction
      expect(events).to.have.lengthOf(1);
      expect(events[0].name).to.equal(EVENTS_NAMES.PAYMENT);
      expect(events[0].amount).to.equal('10');
      expect(events[0].timestamp).to.be.a('number');
      expect(events[0].parameters!.from).to.equal(payerAddress);
      expect(events[0].parameters!.to).to.equal(paymentAddress);
      expect(events[0].parameters!.block).to.be.a('number');
      expect(events[0].parameters!.txHash).to.be.a('string');
    });

    it('gets an empty list of events for an address without ERC20 on localhost', async () => {
      const infoRetriever = new ProxyERC20InfoRetriever(
        requestIdMock,
        proxyContractAddress,
        erc20LocalhostContractAddress,
        emptyAddress,
        EVENTS_NAMES.PAYMENT,
        'private',
      );

      const events = await infoRetriever.getTransferEvents();
      expect(events).to.be.empty;
    });
  });
});
