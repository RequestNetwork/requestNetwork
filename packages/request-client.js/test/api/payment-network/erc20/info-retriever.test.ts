import ERC20InfoRetriever from '../../../../src/api/payment-network/erc20/info-retriever';

import 'chai';
import 'mocha';

const chai = require('chai');
const expect = chai.expect;

const erc20FAUContractAddress = '0xfab46e002bbf0b4509813474841e0716e6730136';
const erc20DAIContractAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';

/* tslint:disable:no-unused-expression */
describe('api/erc20/mainnet-address-based', function() {
  this.timeout(5000);

  describe('on testnet', () => {
    it('can get the testnet balance of an address', async () => {
      const paymentAddress = '0x6a08d2c8f251af1f17b5943f7f7bb7078c50e29a';
      const balanceObject = await ERC20InfoRetriever(
        erc20FAUContractAddress,
        paymentAddress,
        'rinkeby',
      );

      expect(balanceObject.decimals).to.be.equal('18');
      // if this assert fails it means this address received another transaction
      expect(balanceObject.tokenEvents).to.have.lengthOf(1);
      expect(balanceObject.tokenEvents[0]).to.deep.equal({
        from: '0x0000000000000000000000000000000000000000',
        to: '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
        value: '1000000000000000000',
      });
    });

    it('gets an empty list of events for an address without ERC20 on testnet', async () => {
      const paymentAddress = '0x8817850e660DCC3C74BE22a09dAa3872A2d5232D';
      const balanceObject = await ERC20InfoRetriever(
        erc20FAUContractAddress,
        paymentAddress,
        'rinkeby',
      );

      expect(balanceObject.decimals).to.be.equal('18');
      expect(balanceObject.tokenEvents).to.be.empty;
    });
  });

  // Skipping this one until we add some DAI to the test address
  describe.skip('on mainnet', () => {
    it('can get the mainnet balance of an address', async () => {
      const paymentAddress = '0x6a08d2c8f251af1f17b5943f7f7bb7078c50e29a';
      const balanceObject = await ERC20InfoRetriever(
        erc20DAIContractAddress,
        paymentAddress,
        'mainnet',
      );

      expect(balanceObject.decimals).to.be.equal('18');
      expect(balanceObject.tokenEvents).to.have.lengthOf(1);
      expect(balanceObject.tokenEvents[0]).to.deep.equal({
        from: '0x2c27D95AB580A332D9829c0374B04e835221351b',
        to: '0x6A08D2C8f251AF1f17B5943f7f7Bb7078c50e29A',
        value: '1000000000000000000',
      });
    });

    it('gets an empty list of events for an address without ERC20 on mainnet', async () => {
      const paymentAddress = '0x8817850e660DCC3C74BE22a09dAa3872A2d5232D';
      const balanceObject = await ERC20InfoRetriever(
        erc20DAIContractAddress,
        paymentAddress,
        'mainnet',
      );

      expect(balanceObject.decimals).to.be.equal('18');
      expect(balanceObject.tokenEvents).to.be.empty;
    });
  });
});
