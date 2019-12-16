import { expect } from 'chai';
import 'mocha';

import { StorageTypes } from '@requestnetwork/types';
import { getSafeGasPriceLimit } from '../src/config';
import EthereumUtils from '../src/ethereum-utils';

const bigNumber: any = require('bn.js');

/* tslint:disable:no-unused-expression */

describe('Ethereum Utils', () => {
  describe('getEthereumNetworkNameFromId', () => {
    it('allows to get the correct network name', async () => {
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.PRIVATE),
      ).to.equals('private');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.MAINNET),
      ).to.equals('mainnet');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.KOVAN),
      ).to.equals('kovan');
      expect(
        EthereumUtils.getEthereumNetworkNameFromId(StorageTypes.EthereumNetwork.RINKEBY),
      ).to.equals('rinkeby');
    });

    it(`should return undefined if the network doesn't exist`, async () => {
      expect(EthereumUtils.getEthereumNetworkNameFromId(2000)).to.be.undefined;
    });
  });

  describe('isGasPriceSafe', () => {
    it('should return true when a safe value is given', async () => {
      expect(EthereumUtils.isGasPriceSafe(new bigNumber(1))).to.be.true;
      expect(EthereumUtils.isGasPriceSafe(new bigNumber(1000))).to.be.true;
      expect(EthereumUtils.isGasPriceSafe(new bigNumber(parseInt(getSafeGasPriceLimit()) - 1))).to
        .be.true;
    });

    it('should return false when an unsafe value is given', async () => {
      expect(EthereumUtils.isGasPriceSafe(new bigNumber(0))).to.be.false;
      expect(EthereumUtils.isGasPriceSafe(new bigNumber(parseInt(getSafeGasPriceLimit())))).to.be
        .false;
    });
  });
});
