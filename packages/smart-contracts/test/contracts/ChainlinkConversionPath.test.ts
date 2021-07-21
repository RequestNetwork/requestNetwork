const { expect } = require('chai');
import { Currency } from '@requestnetwork/currency';
import { ethers, network } from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import { chainlinkConversionPath } from '../..';
import { ChainlinkConversionPath, ChainlinkConversionPath__factory } from '../../types';
import { localERC20AlphaArtifact, localUSDTArtifact } from './localArtifacts';

const address1 = '0x1111111111111111111111111111111111111111';
const address2 = '0x2222222222222222222222222222222222222222';
const address3 = '0x3333333333333333333333333333333333333333';
const address4 = '0x4444444444444444444444444444444444444444';
const address5 = '0x5555555555555555555555555555555555555555';
const address6 = '0x6666666666666666666666666666666666666666';

const ETH_address = Currency.fromSymbol('ETH').getHash();
const USD_address = Currency.fromSymbol('USD').getHash();
const EUR_address = Currency.fromSymbol('EUR').getHash();
let DAI_address: string;
let USDT_address: string;
let conversionPathInstance: ChainlinkConversionPath;

describe('contract: ChainlinkConversionPath', () => {
  beforeEach(async () => {
    const [signer] = await ethers.getSigners();
    conversionPathInstance = new ChainlinkConversionPath__factory(signer).attach(
      chainlinkConversionPath.getAddress(network.name),
    );
    USDT_address = localUSDTArtifact.getAddress(network.name);
    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
  });

  describe('updateAggregator', async () => {
    it('can updateAggregator', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(addressAggregator).equal('0x0000000000000000000000000000000000000000');

      await conversionPathInstance.updateAggregator(address1, address2, address3);

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(addressAggregator).equal(address3);
    });
  });

  describe('updateAggregatorsList', async () => {
    it('can updateAggregatorsList', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(
        addressAggregator,
        '0x0000000000000000000000000000000000000000',
        'addressAggregator must be 0x',
      );

      addressAggregator = await conversionPathInstance.allAggregators(address4, address5);
      expect(
        addressAggregator,
        '0x0000000000000000000000000000000000000000',
        'addressAggregator must be 0x',
      );

      await conversionPathInstance.updateAggregatorsList(
        [address1, address4],
        [address2, address5],
        [address3, address6],
      );

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(addressAggregator, address3, 'addressAggregator must be 0x333..');
      addressAggregator = await conversionPathInstance.allAggregators(address4, address5);
      expect(addressAggregator, address6, 'addressAggregator must be 0x666..');
    });
  });

  describe('getRate', async () => {
    describe('only fiat rates', async () => {
      it('can get rate from EUR to USD', async () => {
        const conversion = await conversionPathInstance.getRate([EUR_address, USD_address]);
        expect(conversion.rate.toString(), '1200000000000000000');
      });

      it('can get rate from USD to EUR', async () => {
        const conversion = await conversionPathInstance.getRate([USD_address, EUR_address]);
        expect(conversion.rate.toString(), '833333333333333333');
      });

      it('can get rate from USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getRate([
          USD_address,
          EUR_address,
          USD_address,
        ]);
        expect(conversion.rate.toString(), '999999999999999999');
      });

      it('can get rate from ETH to USD to EUR', async () => {
        const conversion = await conversionPathInstance.getRate([
          ETH_address,
          USD_address,
          EUR_address,
        ]);
        expect(conversion.rate.toString(), '41666666666');
      });
    });
  });

  describe('Ethereum rates', async () => {
    it('can get rate from USD to ETH', async () => {
      const conversion = await conversionPathInstance.getRate([USD_address, ETH_address]);
      expect(conversion.rate.toString(), '20000000000000000000000000');
    });

    it('can get rate from ETH to USD', async () => {
      const conversion = await conversionPathInstance.getRate([ETH_address, USD_address]);
      expect(conversion.rate.toString(), '50000000000');
    });

    it('can get rate from EUR to USD to ETH', async () => {
      const conversion = await conversionPathInstance.getRate([
        EUR_address,
        USD_address,
        ETH_address,
      ]);
      expect(conversion.rate.toString(), '24000000000000000000000000');
    });

    it('can get rate from USD to ERC20', async () => {
      const conversion = await conversionPathInstance.getRate([USD_address, DAI_address]);
      expect(conversion.rate.toString(), '9900990099009900990099009900');
    });

    it('can get rate from ETH to USD to ERC20', async () => {
      const conversion = await conversionPathInstance.getRate([
        ETH_address,
        USD_address,
        DAI_address,
      ]);
      expect(conversion.rate.toString(), '495049504950495049504');
    });
  });

  describe('USDT rates', async () => {
    it('can get rate from USD to ETH to USDT', async () => {
      const conversion = await conversionPathInstance.getRate([
        USD_address,
        ETH_address,
        USDT_address,
      ]);
      expect(conversion.rate.toString(), '10000000000000000');
    });

    it('can get rate from USDT to ETH to USD', async () => {
      const conversion = await conversionPathInstance.getRate([
        USDT_address,
        ETH_address,
        USD_address,
      ]);
      expect(conversion.rate.toString(), '100000000000000000000');
    });
  });

  describe('getConversion', async () => {
    describe('only fiat conversion', async () => {
      it('can convert EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          EUR_address,
          USD_address,
        ]);
        expect(conversion.result.toString(), '12000000000');
      });

      it('can convert USD to EUR', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          USD_address,
          EUR_address,
        ]);
        expect(conversion.result.toString(), '8333333333');
      });

      it('can convert USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          USD_address,
          EUR_address,
          USD_address,
        ]);
        expect(conversion.result.toString(), '9999999999');
      });
    });

    describe('Ethereum conversion', async () => {
      it('can convert USD to ETH', async () => {
        const conversion = await conversionPathInstance.getConversion('100000000000', [
          USD_address,
          ETH_address,
        ]);
        expect(conversion.result.toString(), '2000000000000000000');
      });

      it('can convert ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('2000000000000000000', [
          ETH_address,
          USD_address,
        ]);
        expect(conversion.result.toString(), '100000000000');
      });

      it('can convert EUR to USD to ETH', async () => {
        const conversion = await conversionPathInstance.getConversion('100000000000', [
          EUR_address,
          USD_address,
          ETH_address,
        ]);
        expect(conversion.result.toString(), '2400000000000000000');
      });

      it('can convert ETH to USD to EUR', async () => {
        const conversion = await conversionPathInstance.getConversion('2000000000000000000', [
          ETH_address,
          USD_address,
          EUR_address,
        ]);
        expect(conversion.result.toString(), '83333333332');
      });
    });

    describe('USDT conversion', async () => {
      it('can convert USD to ETH to USDT', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          USD_address,
          ETH_address,
          USDT_address,
        ]);
        expect(conversion.result.toString(), '100000000');
      });

      it('can convert USDT to ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('100000000', [
          USDT_address,
          ETH_address,
          USD_address,
        ]);
        expect(conversion.result.toString(), '10000000000');
      });
    });
  });
});
