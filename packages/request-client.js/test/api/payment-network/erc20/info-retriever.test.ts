// tslint:disable: no-invalid-this
// tslint:disable: no-magic-numbers
import ERC20InfoRetriever from '../../../../src/api/payment-network/erc20/info-retriever';

import 'chai';
import 'mocha';

const chai = require('chai');
const expect = chai.expect;

const erc20LocalhostContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';

/* tslint:disable:no-unused-expression */
describe('api/erc20/info-retriever', () => {
  describe('on localhost', () => {
    const paymentAddress = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
    const payerAddress = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
    const emptyAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';

    it('can get the localhost balance of an address', async () => {
      const balanceObject = await ERC20InfoRetriever(
        erc20LocalhostContractAddress,
        paymentAddress,
        'private',
      );

      expect(balanceObject.decimals).to.be.equal('18');
      // if this assert fails it means this address received another transaction
      expect(balanceObject.tokenEvents).to.have.lengthOf(1);
      expect(balanceObject.tokenEvents[0]).to.deep.equal({
        from: payerAddress,
        to: paymentAddress,
        value: '10',
      });
    });

    it('gets an empty list of events for an address without ERC20 on localhost', async () => {
      const balanceObject = await ERC20InfoRetriever(
        erc20LocalhostContractAddress,
        emptyAddress,
        'private',
      );

      expect(balanceObject.decimals).to.be.equal('18');
      expect(balanceObject.tokenEvents).to.be.empty;
    });
  });
});
